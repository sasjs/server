/**
 * Asserts that the header's search box answers for the screen it is on.
 *
 * The failure this exists to catch is the one that was there: one global search,
 * so a query on the API explorer returned documentation pages and a query on the
 * apps screen returned neither apps nor anything else useful. The rule is a pure
 * function of the route, the caller's grants, the query and the sources, so it is
 * asserted directly rather than through a rendered box - see the note at the end
 * for why the component is not source-matched here.
 *
 * Run with `npm run test:search`.
 */
import { registerHooks } from 'node:module'

import { tsResolverHooks } from './node-ts-resolver.mjs'

registerHooks(tsResolverHooks)

const { searchScope, searchHint, matches, LIMIT } =
  await import('../src/utils/search.ts')
const { APPS_LISTING } = await import('../src/utils/appUrl.ts')

const failures = []
const check = (label, actual, expected) => {
  if (actual !== expected) failures.push(`${label}: ${actual} !== ${expected}`)
}

const kinds = (hits) => [...new Set(hits.map((hit) => hit.kind))].join(',')

// --- which screen is which ---------------------------------------------------

check('docs root', searchScope('/docs'), 'docs')
check('docs page', searchScope('/docs/guides/settings'), 'docs')
check(
  'docs page, trailing slash',
  searchScope('/docs/guides/settings/'),
  'docs'
)
check('a path that merely starts with the word', searchScope('/docsfoo'), 'all')

check('api', searchScope('/api'), 'api')
// `/api-app/` is not the API explorer and not an app: nothing of its own to
// search, so it keeps the both-lists box
check('a path beside the API', searchScope('/api-app/'), 'all')
check('a path under the API', searchScope('/api/anything'), 'api')

check('apps', searchScope('/apps'), 'apps')
check('an app itself is not the listing', searchScope('/app/mario'), 'all')

// The apps screen answers on its pre-short-URL address too (App.tsx renders the
// same screen there, because a browser build has no server to redirect it), so a
// bookmark of it gets the same search
check('apps, old address', searchScope('/SASjsApps'), 'apps')
check('apps, old address, trailing slash', searchScope('/SASjsApps/'), 'apps')

// the other old addresses render screens with nothing of their own
check('studio, old address', searchScope('/SASjsStudio'), 'all')
check('settings, old address', searchScope('/SASjsSettings'), 'all')
check('logon', searchScope('/logon'), 'all')

// A caller without the App Stream grant cannot read the listing - the screen gives
// them the built-in tiles - so the box must not promise "Search apps" and then
// report nothing. It answers both lists, as every screen without one of its own.
check('apps without the grant', searchScope('/apps', false), 'all')
check(
  'apps, old address, without the grant',
  searchScope('/SASjsApps', false),
  'all'
)
// the grant changes nothing on the screens that do not search apps
check('docs with the grant', searchScope('/docs', true), 'docs')
check('api without the grant', searchScope('/api', false), 'api')

// the screens with nothing of their own keep the old, both-lists behaviour
check('dashboard', searchScope('/'), 'all')
check('studio', searchScope('/studio'), 'all')
check('settings', searchScope('/settings'), 'all')

// the promise the field makes, per screen
check('docs hint', searchHint('docs'), 'Search the docs')
check('api hint', searchHint('api'), 'Search the API')
check('apps hint', searchHint('apps'), 'Search apps')
check('dashboard hint', searchHint('all'), 'Search docs and API')

// --- what each scope answers from ---------------------------------------------

const docs = [
  {
    location: 'guides/settings/',
    title: 'Settings',
    text: 'configure the server'
  },
  {
    location: 'apps/#creating-apps',
    title: 'Apps',
    text: 'publish a frontend'
  },
  // a word the API also answers: the two screens must not borrow each other's
  {
    location: 'reference/info/',
    title: 'Server information',
    text: 'what it answers'
  }
]

const operations = [
  {
    method: 'GET',
    path: '/SASjsApi/info',
    summary: 'Returns server information'
  },
  {
    method: 'POST',
    path: '/SASjsApi/drive/deploy',
    summary: 'Deploy a frontend zip'
  }
]

const apps = [
  {
    id: 'a1',
    name: 'mario',
    appLoc: '/Public/app/mario',
    logo: null,
    url: '/app/a1/',
    publishedAt: null
  },
  {
    id: 'b2',
    name: 'rockroller',
    appLoc: null,
    logo: null,
    url: '/app/b2/',
    publishedAt: null
  }
]

const sources = { docs, operations, apps }

// a word the docs and the API both use: each screen sees only its own
const deployed = { docs, operations, apps }

check(
  'docs scope returns docs only',
  kinds(matches('docs', 'apps', deployed)),
  'docs'
)
check(
  'docs scope ignores the API list',
  kinds(matches('docs', 'info', deployed)),
  'docs'
)
check(
  'api scope returns api only',
  kinds(matches('api', 'info', deployed)),
  'api'
)
check(
  'api scope ignores the docs list',
  kinds(matches('api', 'settings', deployed)),
  ''
)
check(
  'apps scope returns apps only',
  kinds(matches('apps', 'mario', deployed)),
  'app'
)
check(
  'apps scope ignores pages',
  kinds(matches('apps', 'settings', deployed)),
  ''
)

const everything = matches('all', 'frontend', deployed)
check(
  'dashboard mixes the two lists',
  [...new Set(everything.map((hit) => hit.kind))].sort().join(','),
  'api,docs'
)

// --- apps are matched on what the registry actually holds ---------------------

const byName = matches('apps', 'mario', sources)
check('app by name', byName.length, 1)
check('app title', byName[0]?.title, 'mario')
check('app detail is the backend', byName[0]?.detail, '/Public/app/mario')
check('app opens in a tab', byName[0]?.href, '/app/mario/')
check('app has no route to navigate', byName[0]?.to, undefined)

// a frontend that names no backend shows its own URL, as the tile does
const ownUrl = matches('apps', 'rock', sources)
check('app without a backend', ownUrl[0]?.detail, '/app/rockroller/')

// the id is what a deploy log prints, and the folder what a dev knows
check('app by id', matches('apps', 'b2', sources)[0]?.title, 'rockroller')
check(
  'app by backend folder',
  matches('apps', 'Public/app', sources)[0]?.title,
  'mario'
)

// a name two apps share cannot be a path segment: the id is used instead
const twins = [
  ...apps,
  {
    id: 'c3',
    name: 'mario',
    appLoc: null,
    logo: null,
    url: '/app/c3/',
    publishedAt: null
  }
]
check(
  'shared name falls back to the id',
  matches('apps', 'mario', { ...sources, apps: twins })[0]?.href,
  '/app/a1/'
)

// --- the request the box makes ------------------------------------------------

// The box reads the same listing the Apps screen, the dashboard and the admin
// grants screen read, through the shared axios instance. Node cannot see a
// request, so the address is pinned here instead: one spelling, under the surface
// the screens use, so a change is deliberate and a bare `fetch` of some other
// path cannot creep back in unnoticed.
check('the listing the box reads', APPS_LISTING, '/AppStream/apps.json')

// --- ranking and limits -------------------------------------------------------

// a title match outranks a passing mention, whichever list it is in
const ranked = matches('docs', 'settings', {
  ...sources,
  docs: [
    { location: 'a/', title: 'Elsewhere', text: 'settings are mentioned here' },
    { location: 'b/', title: 'Settings', text: 'the page itself' }
  ]
})
check('title beats body text', ranked[0]?.title, 'Settings')

// a section anchor resolves to its page, which is what the route can address
check(
  'section goes to its page',
  matches('docs', 'publish', sources)[0]?.to,
  '/docs/apps/'
)

// one letter is not a query: it matches most of the index
check('one character asks nothing', matches('docs', 's', sources).length, 0)

// a long answer is truncated to what a reader can choose from
const many = Array.from({ length: 30 }, (_, index) => ({
  method: 'GET',
  path: `/many/${index}`,
  summary: 'many'
}))
check(
  'limit',
  matches('api', 'many', { ...sources, operations: many }).length,
  LIMIT
)

// The box itself is not asserted here, and nothing else in the tree asserts it
// either: it renders JSX, node cannot evaluate that, and this repository has no
// web rendering suite. Matching its source text instead pins spellings rather
// than behaviour - a rename, or inlining `searchHint(scope)` in the placeholder,
// would fail the suite while the search went on working - so those assertions
// were removed rather than kept as a false comfort.
//
// What the component decides is the scope, and that is the pure function above.
// That the field then follows it - the placeholder and accessible name per
// screen, the list consulted, the destination of a hit - was verified by hand in
// a browser against a site built from this branch (placeholder "Search the docs"
// on /docs, "Search the API" on /api, "Search apps" on /apps and /SASjsApps,
// "Search docs and API" elsewhere; a docs-only term returning nothing on /api
// and the Settings page on /docs; an app result opening /app/<name>/ in a new
// tab). That is a record of a check made while writing this, not a test: if the
// component's wiring needs a standing guard, it needs a rendering suite this
// repository does not have yet.

if (failures.length) {
  console.error(`FAILED (${failures.length})`)
  for (const failure of failures) console.error(`  - ${failure}`)
  process.exit(1)
}

console.log('search: scoped to the screen, apps searched by their own fields')
