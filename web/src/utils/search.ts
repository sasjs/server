/**
 * What the header's search box looks for, and from which screen.
 *
 * One field in the bar on every screen, but not one question: a reader on the
 * documentation means the documentation, a reader on the API explorer means an
 * operation, a reader on the apps screen is looking for an app, and a reader in
 * Studio is looking for a file on the drive. Answering all of them everywhere is
 * why a query like "permissions" used to return an API operation before the page
 * called Permissions - the box answered a question nobody on that screen had
 * asked.
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

/**
 * The screens with something of their own to search.
 *
 * `all` is the two build-time lists and `everything` is those plus the apps
 * listing and the drive - the dashboard's answer, for the reader who has just
 * signed in and does not yet know which screen holds what they want.
 */
export type Scope = 'docs' | 'api' | 'apps' | 'drive' | 'all' | 'everything'

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
  /** The drive's file paths, as `walkDrivePaths` collects them. */
  files: string[]
}

/** One result, whichever list it came from. */
export interface Hit {
  kind: 'docs' | 'api' | 'app' | 'file'
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

/**
 * The paths Studio answers on, for the same reason the apps screen has two: a
 * bookmark of the old address renders the editor, and a reader in the editor is
 * looking for a file, whichever address brought them there.
 */
const STUDIO_PATHS = ['/studio', '/SASjsStudio']

/** Whether a path is the screen at `root`, or a path under it. */
const isScreen = (pathname: string, root: string): boolean =>
  pathname === root || pathname.startsWith(`${root}/`)

/**
 * The screen a path belongs to.
 *
 * The docs are a subtree - `/docs/guides/settings/` - and the others are single
 * screens, but a path under one of those is the same screen as its root. The
 * dashboard and settings have nothing of their own to search, so there the box
 * keeps answering the documentation and the API, which is what it did before it
 * learned to narrow.
 *
 * Two scopes need to know more than the path:
 *
 * The apps listing is refused to a caller without the App Stream grant, and the
 * screen answers that caller with the built-in tiles instead. A box that still
 * said "Search apps" would promise a list it has not been allowed to read and
 * report "nothing matches" for a question it never asked, so the scope falls
 * back to the both-lists search - the same answer every screen without a list of
 * its own gives. The drive is the same story on a different grant: its files are
 * read one folder at a time, through the route the explorer itself uses, and a
 * caller who cannot read that route has no drive to search.
 *
 * The dashboard is the one screen that answers from all four lists, because it
 * is the one screen whose question is "where is the thing I want" rather than
 * "on this screen". Only a caller holding both grants gets that scope: for
 * anyone else it falls back to the both-lists search, which cannot promise a
 * listing the caller may not read.
 */
export const searchScope = (
  pathname: string,
  canListApps = true,
  canListDrive = true
): Scope => {
  if (isScreen(pathname, '/docs')) return 'docs'
  if (isScreen(pathname, '/api')) return 'api'
  if (canListApps && APPS_PATHS.some((path) => isScreen(pathname, path)))
    return 'apps'
  if (canListDrive && STUDIO_PATHS.some((path) => isScreen(pathname, path)))
    return 'drive'
  if (pathname === '/' && canListApps && canListDrive) return 'everything'

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
  if (scope === 'drive') return 'Search the drive'
  if (scope === 'everything') return 'Search everything'

  return 'Search docs and API'
}

/** The hint as a sentence, for the field's accessible name. */
export const searchLabel = (scope: Scope): string => {
  if (scope === 'docs') return 'Search the documentation'
  if (scope === 'api') return 'Search the API'
  if (scope === 'apps') return 'Search the apps'
  if (scope === 'drive') return 'Search the drive'
  if (scope === 'everything')
    return 'Search the documentation, the API, the apps and the drive'

  return 'Search the documentation and the API'
}

/** The word shown beside a result, so a mixed list still says what each is. */
export const kindLabel = (kind: Hit['kind']): string => {
  if (kind === 'api') return 'API'
  if (kind === 'app') return 'App'
  if (kind === 'file') return 'File'

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

/**
 * A drive file, matched on its own name first and its folders second.
 *
 * A reader typing `orders` means the file called `orders.sas`, not the eleven
 * others that happen to live under a folder with that word in its path; a reader
 * typing `demo/services` means a folder, and wants what is inside it. So the name
 * outranks the path, exactly as a page's title outranks the page's body text.
 *
 * The line under the name is the folder the file sits in - the drive root itself
 * for a file at the top - because that is what tells two files of the same name
 * apart, and the name is already in the result.
 */
const fileHits = (needle: string, files: string[], hits: Ranked[]) => {
  for (const filePath of files) {
    const segments = filePath.split('/')
    const name = segments[segments.length - 1] || filePath
    // the path is the weaker match, and it contains the name, so a name match
    // can never be scored as a path match by accident
    const rank = score(needle, name, filePath)

    if (rank)
      hits.push({
        rank,
        hit: {
          kind: 'file',
          title: name,
          detail: segments.slice(0, -1).join('/') || '/',
          // the address the editor opens a file by - `?filePath=` is how a deep
          // link, a reload and the back button all land on the same file
          to: `/studio?filePath=${encodeURIComponent(filePath)}`
        }
      })
  }
}

interface Ranked {
  hit: Hit
  rank: number
}

/**
 * How many kinds a mixed search has to give a turn to, in the order it gives it.
 *
 * The order is the one a reader is most likely to mean: the pages that explain a
 * thing, then the calls that do it, then the app that already does it, then the
 * file they wrote themselves.
 */
const KIND_ORDER: Hit['kind'][] = ['docs', 'api', 'app', 'file']

/**
 * How many results one kind gets before the others take their turn. Three rounds
 * of four kinds fills the twelve a mixed search shows, so a kind that has three
 * matches is always visible however many pages share the word.
 */
const PER_KIND = Math.ceil(LIMIT / KIND_ORDER.length)

/**
 * A mixed answer, one result per kind in turn, then whatever room is left.
 *
 * Without the turns, the longest list wins every slot - and the documentation
 * index is by far the longest. With them, "app" shows the Apps page, the App
 * Stream calls, the app called app and the file called app.sas, and a query only
 * one kind matches still fills the list from that kind alone.
 */
const everyKind = (ranked: Ranked[]): Ranked[] => {
  const lists = KIND_ORDER.map((kind) =>
    ranked.filter((entry) => entry.hit.kind === kind)
  )
  const chosen: Ranked[] = []

  for (let round = 0; round < PER_KIND && chosen.length < LIMIT; round++)
    for (const list of lists)
      if (list[round] && chosen.length < LIMIT) chosen.push(list[round])

  for (const entry of ranked)
    if (chosen.length < LIMIT && !chosen.includes(entry)) chosen.push(entry)

  return chosen
}

/**
 * The results for a query, in the order worth reading.
 *
 * Only the lists this screen searches are consulted, so a query on `/docs` cannot
 * return an operation and a query on `/apps` cannot return a page. Below two
 * characters nothing is asked: one letter matches most of the index, and a list
 * that long is slower to read than typing another letter is.
 *
 * A mixed search needs one rule more. The documentation index alone holds more
 * entries than a result list has room for, so a query like "app" would fill every
 * slot with pages and leave the app of that name out - a search that says it
 * covers everything and answers from one list. `everyKind` gives each kind a turn
 * first and fills what is left afterwards.
 */
export const matches = (
  scope: Scope,
  query: string,
  sources: Sources
): Hit[] => {
  const needle = query.trim().toLowerCase()

  if (needle.length < 2) return []

  const hits: Ranked[] = []

  if (scope === 'docs' || scope === 'all' || scope === 'everything')
    docHits(needle, sources.docs, hits)
  if (scope === 'api' || scope === 'all' || scope === 'everything')
    operationHits(needle, sources.operations, hits)
  if (scope === 'apps' || scope === 'everything')
    appHits(needle, sources.apps, hits)
  if (scope === 'drive' || scope === 'everything')
    fileHits(needle, sources.files, hits)

  const ranked = hits.sort(
    (first, second) =>
      second.rank - first.rank ||
      first.hit.title.localeCompare(second.hit.title)
  )

  return (
    scope === 'everything' ? everyKind(ranked) : ranked.slice(0, LIMIT)
  ).map((entry) => entry.hit)
}
