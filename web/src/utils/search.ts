/**
 * What the header's search box looks for, and from which screen.
 *
 * One field in the bar on every screen, but not one question: a reader on the
 * documentation means the documentation, a reader on the API explorer means an
 * operation, and a reader on the apps screen is looking for an app. Answering all
 * of them everywhere is why a query like "permissions" used to return an API
 * operation before the page called Permissions - the box answered a question
 * nobody on that screen had asked.
 *
 * The rule lives here rather than in the component because it is the part worth
 * testing, and because the placeholder, the results and the destination all read
 * from it: three copies of "which screen is this" would be three copies that
 * drift apart.
 *
 * Everything here is a pure function of the route, the query and the sources, so
 * a node script can exercise it without rendering anything - see
 * `scripts/test-search.mjs`.
 */
import { appHref } from './appUrl'

/** The screens with something of their own to search. */
export type Scope = 'docs' | 'api' | 'apps' | 'all'

/** One entry of the index MkDocs writes for its own search. */
export interface DocsEntry {
  location: string
  title: string
  text: string
}

/** One operation of the REST API, as the build writes the list from the spec. */
export interface Operation {
  method: string
  path: string
  summary: string
}

/**
 * An app as `/AppStream/apps.json` describes it.
 *
 * The registry carries no prose about an app: a publish records a name, the
 * backend it calls, a logo and a date. So these are the fields a query can match,
 * and a description is not among them.
 */
export interface AppRow {
  id: string
  name: string
  appLoc: string | null
  logo: string | null
  url: string
  publishedAt: string | null
}

/** Everything the box can answer from, whether or not this screen loaded it. */
export interface Sources {
  docs: DocsEntry[]
  operations: Operation[]
  apps: AppRow[]
}

/** One result, whichever list it came from. */
export interface Hit {
  kind: 'docs' | 'api' | 'app'
  title: string
  detail: string
  /** The app's route, for a hit that is opened in place. */
  to?: string
  /** The URL to open in a new tab, for an app - which is not a screen of this app. */
  href?: string
}

/** How many results are worth showing: enough to choose from, not a page. */
export const LIMIT = 12

/**
 * The paths a screen answers on.
 *
 * `/SASjsApps` is the address the apps screen had before the short URLs, and
 * `App.tsx` renders the same `<Apps />` there - the server redirects it, a
 * browser-hosted build has no server to redirect, so a bookmark lands on the
 * screen itself. A screen is what the path renders, not what the path spells, so
 * the alias carries the same search as the short one.
 */
const APPS_PATHS = ['/apps', '/SASjsApps']

/** Whether a path is the screen at `root`, or a path under it. */
const isScreen = (pathname: string, root: string): boolean =>
  pathname === root || pathname.startsWith(`${root}/`)

/**
 * The screen a path belongs to.
 *
 * The docs are a subtree - `/docs/guides/settings/` - and the others are single
 * screens, but a path under one of those is the same screen as its root. Any
 * other screen (the dashboard, studio, settings) has nothing of its own to search,
 * so the box keeps answering the documentation and the API, which is what it did
 * before it learned to narrow.
 *
 * The apps are the exception that needs to know more than the path: the listing
 * is refused to a caller without the App Stream grant, and the screen answers
 * that caller with the built-in tiles instead. A box that still said "Search
 * apps" would promise a list it has not been allowed to read and report "nothing
 * matches" for a question it never asked, so the scope falls back to the
 * both-lists search - the same answer every screen without a list of its own
 * gives.
 */
export const searchScope = (pathname: string, canListApps = true): Scope => {
  if (isScreen(pathname, '/docs')) return 'docs'
  if (isScreen(pathname, '/api')) return 'api'
  if (canListApps && APPS_PATHS.some((path) => isScreen(pathname, path)))
    return 'apps'

  return 'all'
}

/**
 * What the field says it searches, which is the promise the results keep.
 *
 * "Search docs and API" on the dashboard and "Search apps" on the apps screen are
 * the same control doing two different jobs, and a placeholder that did not say so
 * would leave the reader guessing which.
 */
export const searchHint = (scope: Scope): string => {
  if (scope === 'docs') return 'Search the docs'
  if (scope === 'api') return 'Search the API'
  if (scope === 'apps') return 'Search apps'

  return 'Search docs and API'
}

/** The hint as a sentence, for the field's accessible name. */
export const searchLabel = (scope: Scope): string => {
  if (scope === 'docs') return 'Search the documentation'
  if (scope === 'api') return 'Search the API'
  if (scope === 'apps') return 'Search the apps'
  return 'Search the documentation and the API'
}

/** The word shown beside a result, so a mixed list still says what each is. */
export const kindLabel = (kind: Hit['kind']): string => {
  if (kind === 'api') return 'API'
  if (kind === 'app') return 'App'

  return 'Docs'
}

/**
 * Where the query matches decides the order.
 *
 * A page whose title contains the word is what the reader meant; a page that
 * mentions it in passing is a second best; and an operation that mentions it in
 * its summary is weaker than one whose path contains it. Without this, a query
 * like "permissions" returns twelve API operations and never shows the page
 * called Permissions.
 */
const score = (needle: string, strong: string, weak: string) => {
  if (strong.toLowerCase().includes(needle)) return 2
  if (weak.toLowerCase().includes(needle)) return 1

  return 0
}

const docHits = (needle: string, docs: DocsEntry[], hits: Ranked[]) => {
  for (const entry of docs) {
    // `apps/#creating-apps` is a section of a page; the reader is taken to the
    // page, which is what the framed route can address.
    const location = entry.location.split('#')[0]
    const rank = score(needle, entry.title, entry.text)

    if (rank)
      hits.push({
        rank,
        hit: {
          kind: 'docs',
          title: entry.title || location || 'Documentation',
          detail: location ? `/${location}` : '/',
          to: `/docs/${location}`
        }
      })
  }
}

const operationHits = (
  needle: string,
  operations: Operation[],
  hits: Ranked[]
) => {
  for (const entry of operations) {
    const line = `${entry.method} ${entry.path}`
    const rank = score(needle, line, entry.summary)

    if (rank)
      hits.push({
        rank,
        hit: {
          kind: 'api',
          title: line,
          detail: entry.summary,
          to: '/api'
        }
      })
  }
}

const appHits = (needle: string, apps: AppRow[], hits: Ranked[]) => {
  for (const app of apps) {
    // The name is what a reader knows. The backend folder and the id are what
    // they may have instead - a link copied from a deploy log names one or the
    // other - so those match as the weaker of the two.
    const rank = score(
      needle,
      app.name,
      `${app.appLoc ?? ''} ${app.id} ${app.url}`
    )

    if (rank)
      hits.push({
        rank,
        hit: {
          kind: 'app',
          title: app.name,
          // the same line the Apps screen puts under a tile: the backend it
          // calls, or its own URL for a frontend that names none
          detail: app.appLoc ?? appHref(app, apps),
          href: appHref(app, apps)
        }
      })
  }
}

interface Ranked {
  hit: Hit
  rank: number
}

/**
 * The results for a query, in the order worth reading.
 *
 * Only the lists this screen searches are consulted, so a query on `/docs` cannot
 * return an operation and a query on `/apps` cannot return a page. Below two
 * characters nothing is asked: one letter matches most of the index, and a list
 * that long is slower to read than typing another letter is.
 */
export const matches = (
  scope: Scope,
  query: string,
  sources: Sources
): Hit[] => {
  const needle = query.trim().toLowerCase()

  if (needle.length < 2) return []

  const hits: Ranked[] = []

  if (scope === 'docs' || scope === 'all') docHits(needle, sources.docs, hits)
  if (scope === 'api' || scope === 'all')
    operationHits(needle, sources.operations, hits)
  if (scope === 'apps') appHits(needle, sources.apps, hits)

  return hits
    .sort(
      (first, second) =>
        second.rank - first.rank ||
        first.hit.title.localeCompare(second.hit.title)
    )
    .slice(0, LIMIT)
    .map((entry) => entry.hit)
}
