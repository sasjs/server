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
 * The dashboard is the one screen that answers from all four lists, so its rule
 * is asserted here too: only for a caller holding both grants, with each kind
 * getting a turn so the longest list cannot answer for all of them.
 *
 * Run with `npm run test:search`.
 */
import { registerHooks } from 'node:module'
import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'

import { tsResolverHooks } from './node-ts-resolver.mjs'

registerHooks(tsResolverHooks)

const { searchScope, searchHint, kindLabel, matches, LIMIT, isSearchQuery } =
  await import('../src/utils/search.ts')
// All folder search consumers must use the matcher predicate, not their own
// threshold, so changing it cannot split the listing, walk, and result behavior.
for (const component of ['folderView.tsx', 'folderSearch.tsx']) {
  const source = await readFile(
    new URL(`../src/components/${component}`, import.meta.url),
    'utf8'
  )
  assert.match(
    source,
    /\bisSearchQuery\s*\(/,
    `${component} uses the matcher predicate`
  )
}
for (const query of ['', ' x ', ' xy ', '  XYZ  ']) {
  const sources = {
    docs: [],
    operations: [],
    apps: [],
    files: [`/${query.trim()}.sas`]
  }
  assert.equal(
    isSearchQuery(query),
    matches('folder', query, sources).length > 0,
    `query eligibility: ${query}`
  )
}
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
check('settings, old address', searchScope('/SASjsSettings'), 'all')
check('logon', searchScope('/logon'), 'all')

// Studio is a screen with a list of its own now: the drive. Both its addresses
// render the editor, so both get the drive search - and a path under either is
// the same screen, as it is for the docs.
check('studio', searchScope('/studio'), 'drive')
check('studio, old address', searchScope('/SASjsStudio'), 'drive')
check(
  'studio, old address, trailing slash',
  searchScope('/SASjsStudio/'),
  'drive'
)
check('a path under studio', searchScope('/studio/anything'), 'drive')

// A caller who cannot read the drive's folders is shown the refusal the route
// gives - there is no listing to walk - so the box must not promise a search of
// a drive it cannot see. It answers both lists, as every screen without a list
// of its own does.
check(
  'studio without the drive grant',
  searchScope('/studio', true, false),
  'all'
)
check(
  'studio, old address, without the drive grant',
  searchScope('/SASjsStudio', true, false),
  'all'
)
// the two grants are independent: holding the drive's changes nothing on the apps
// screen, and holding the App Stream's changes nothing in Studio
check('apps without the drive grant', searchScope('/apps', true, false), 'apps')
check('docs without the drive grant', searchScope('/docs', true, false), 'docs')

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

// the screens with nothing of their own keep the old, both-lists behaviour, and
// the dashboard - the one screen whose question is "where is it" - answers from
// everything it may read
check('dashboard', searchScope('/'), 'everything')
check('settings', searchScope('/settings'), 'all')

// the dashboard's promise is only as wide as its grants: a caller who cannot
// read the listing, or the drive, is offered the both-lists search rather than a
// scope whose results would not arrive
check('dashboard without the apps grant', searchScope('/', false), 'all')
check('dashboard without the drive grant', searchScope('/', true, false), 'all')
check('dashboard with both grants', searchScope('/', true, true), 'everything')
// the dashboards of the other spellings of a screen are untouched: /apps and
// /studio are still their own screens whatever the grants
check('apps is not the dashboard', searchScope('/apps'), 'apps')
check('studio is not the dashboard', searchScope('/studio'), 'drive')

// the promise the field makes, per screen
check('docs hint', searchHint('docs'), 'Search the docs')
check('api hint', searchHint('api'), 'Search the API')
check('apps hint', searchHint('apps'), 'Search apps')
check('drive hint', searchHint('drive'), 'Search the drive')
check('dashboard hint', searchHint('everything'), 'Search everything')
check('settings hint', searchHint('all'), 'Search docs and API')

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

const files = [
  '/root.sas',
  '/home/sasjsadmin/program.sas',
  '/Public/demo/orders.csv',
  '/Public/demo/services/web/index.html',
  '/Public/demo/services/macro/orders.sas',
  '/code/core/mf_abort.sas',
  // a file whose FOLDER is what matches: named so that it sorts before the
  // files that carry the word in their own names, which is the case that tells
  // "the name outranks the path" apart from "the alphabet decided"
  '/orders/aaa.txt'
]

// one list per scope, and the bodies a folder search reads - which every other
// scope leaves empty, because no other screen asks what is inside a file
const sources = { docs, operations, apps, files, contents: [] }

// a word the docs and the API both use: each screen sees only its own
const deployed = { docs, operations, apps, files, contents: [] }

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
check(
  'drive scope returns files only',
  kinds(matches('drive', 'orders', deployed)),
  'file'
)
// the docs carry the word "settings" and the drive does not
check(
  'drive scope ignores the other lists',
  kinds(matches('drive', 'settings', deployed)),
  ''
)
// a word the drive carries: the settings screen keeps the both-lists search, and
// a screen that started offering files would be answering a question nobody on
// it asked
check(
  'the settings screen does not search the drive',
  kinds(matches('all', 'orders', deployed)),
  ''
)

const everything = matches('all', 'frontend', deployed)
check(
  'the both-lists screen mixes the two lists',
  [...new Set(everything.map((hit) => hit.kind))].sort().join(','),
  'api,docs'
)

// --- the dashboard searches everything ---------------------------------------

// the word "orders" is in a docs page, an operation, an app and a file: all four
// answer on the dashboard
const wide = {
  docs: [{ location: 'orders/', title: 'Orders docs', text: '' }],
  operations: [{ method: 'GET', path: '/orders', summary: 'list orders' }],
  apps: [
    {
      id: 'o1',
      name: 'orders app',
      appLoc: null,
      logo: null,
      url: '/app/o1/',
      publishedAt: null
    }
  ],
  files: ['/reports/orders.sas'],
  contents: []
}
check(
  'the dashboard answers from all four lists',
  kinds(matches('everything', 'orders', wide)),
  'docs,api,app,file'
)
check(
  'the drive is searched from the dashboard',
  kinds(matches('everything', 'orders', deployed)),
  'file'
)
check(
  'apps are searched from the dashboard',
  kinds(matches('everything', 'mario', deployed)),
  'app'
)

// The docs index is the longest list by far, so a plain rank-and-truncate would
// let it fill every slot. Each kind gets a turn first: a query the pages answer
// twenty times and one app answers once still shows the app.
const flooded = {
  ...deployed,
  docs: Array.from({ length: 30 }, (_, index) => ({
    location: `app-${index}/`,
    title: `Application ${index}`,
    text: 'app'
  })),
  apps: [
    {
      id: 'a1',
      name: 'app',
      appLoc: null,
      logo: null,
      url: '/app/a1/',
      publishedAt: null
    }
  ]
}
const mixed = matches('everything', 'app', flooded)
check('a long list cannot fill every slot', mixed.length, LIMIT)
check(
  'every kind gets a turn',
  [...new Set(mixed.map((hit) => hit.kind))].sort().join(','),
  'app,docs'
)
check(
  'the one app appears before the pages run out',
  mixed.findIndex((hit) => hit.kind === 'app') < 4,
  true
)

// a query only one kind answers still fills the list from that kind alone
const manyDocs = matches('everything', 'app', {
  ...deployed,
  docs: flooded.docs,
  apps: [],
  operations: [],
  files: []
})
check('one kind still fills the list', manyDocs.length, LIMIT)
check('and it is that kind', kinds(manyDocs), 'docs')

// the result keeps the shape each screen already relies on: an app opens in a
// tab and a file opens in the editor, whichever list they came from
const appHit = matches('everything', 'mario', deployed).find(
  (hit) => hit.kind === 'app'
)
check(
  'an app result from the dashboard opens in a tab',
  appHit?.href,
  '/app/mario/'
)
check('an app result has no route', appHit?.to, undefined)
const fileHit = matches('everything', 'orders', deployed).find(
  (hit) => hit.kind === 'file'
)
check(
  'a file result from the dashboard opens in the editor',
  fileHit?.to,
  '/studio?filePath=%2FPublic%2Fdemo%2Forders.csv'
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

// --- the drive is searched by file name, then by the folders above it ---------

// two files carry the word: the one NAMED orders outranks the one that merely
// lives under a folder with that name, whatever the alphabet says
const orders = matches('drive', 'orders', sources)
check('file by name', orders[0]?.title, 'orders.csv')
check('a name beats a folder', orders[0]?.detail, '/Public/demo')
check(
  'both name matches outrank the folder match',
  orders.map((hit) => hit.title).join(','),
  'orders.csv,orders.sas,aaa.txt'
)

// a query with a slash in it is a path, and a path segment matches too - this is
// the reader who remembers where the file lives rather than what it is called
const byFolder = matches('drive', 'demo/services/macro', sources)
check('file by its folders', byFolder[0]?.title, 'orders.sas')
check('folder line', byFolder[0]?.detail, '/Public/demo/services/macro')

// a file at the drive root has no folder to show: '/' rather than an empty line
check('root file', matches('drive', 'root.sas', sources)[0]?.detail, '/')
check(
  'a file deep on the drive shows its folder',
  matches('drive', 'program.sas', sources)[0]?.detail,
  '/home/sasjsadmin'
)

// the result opens the file the way a deep link does - encoded, because a drive
// path is all slashes and may carry a space
check(
  'a file opens in the editor',
  matches('drive', 'index.html', sources)[0]?.to,
  '/studio?filePath=%2FPublic%2Fdemo%2Fservices%2Fweb%2Findex.html'
)
check(
  'a file has no tab to open',
  matches('drive', 'index.html', sources)[0]?.href,
  undefined
)
check(
  'two characters are enough',
  matches('drive', 'mf', sources)[0]?.title,
  'mf_abort.sas'
)
check('one character asks nothing', matches('drive', 'o', sources).length, 0)

// a long answer is truncated here too
const manyFiles = Array.from(
  { length: 30 },
  (_, index) => `/many/file${index}.sas`
)
check(
  'file limit',
  matches('drive', 'file', { ...sources, files: manyFiles }).length,
  LIMIT
)

// --- a folder's own search: names and bodies, for one folder ------------------

// The folder scope is not a route's and has no hint of its own: a folder's page
// carries its own box and names itself in the field. What the scope ANSWERS with is
// what follows - and these are the same rules the header's box uses elsewhere, so
// a file named for the query still outranks one that only mentions it.

const folderFiles = [
  '/Public/demo/services/orders.sas',
  '/Public/demo/services/run.sas',
  '/Public/demo/services/macro/abort.sas'
]

const folderContents = [
  { path: '/Public/demo/services/orders.sas', text: '/* the order report */' },
  {
    path: '/Public/demo/services/run.sas',
    text: '%let report = 1;\n%include "orders";'
  },
  { path: '/Public/demo/services/macro/abort.sas', text: '%macro abort;' }
]

const inFolder = matches('folder', 'orders', {
  docs: [],
  operations: [],
  apps: [],
  files: folderFiles,
  contents: folderContents
})

// a file NAMED for the query is what the reader means; a file that mentions it is
// the second best answer, which is the same rule a page's title and body follow
check(
  'a folder search answers by name and by body',
  kinds(inFolder),
  'file,text'
)
check('a name outranks a body', inFolder[0]?.title, 'orders.sas')
check(
  'a body hit is titled by its path, so two files of one name cannot be confused',
  inFolder.find((hit) => hit.kind === 'text')?.title,
  '/Public/demo/services/run.sas'
)
check(
  'a body hit says which line to look at',
  inFolder.find((hit) => hit.kind === 'text')?.detail,
  'line 2: %include "orders";'
)
check(
  'a body hit opens the file the way a name hit does',
  inFolder.find((hit) => hit.kind === 'text')?.to,
  '/studio?filePath=%2FPublic%2Fdemo%2Fservices%2Frun.sas'
)
check('a body hit is labelled for what it is', kindLabel('text'), 'Content')

// nothing read means nothing to say: a folder search with no bodies answers from
// the listing alone, which is how it behaves while the files are still being read
check(
  'a folder search with no bodies answers by name',
  kinds(
    matches('folder', 'orders', {
      ...sources,
      files: folderFiles,
      contents: []
    })
  ),
  'file'
)

// The other scopes never read a body: the drive search costs one request per
// folder, and a screen the reader did not start a folder search from must not pay
// for a file per file.
check(
  'the drive scope does not read bodies',
  kinds(
    matches('drive', 'orders', {
      ...sources,
      files: folderFiles,
      contents: folderContents
    })
  ),
  'file'
)
check(
  'the dashboard does not read bodies',
  kinds(
    matches('everything', 'orders', { ...sources, contents: folderContents })
  ),
  'file'
)

// A file whose NAME matches is not listed again for a line in its body: two rows
// would open the same document, and the reader would count two files where there
// is one
const bothAnswers = matches('folder', 'abort', {
  docs: [],
  operations: [],
  apps: [],
  files: folderFiles,
  contents: folderContents
})
check('a word the name and the body both carry', kinds(bothAnswers), 'file')
check('and the file is listed once', bothAnswers.length, 1)
check(
  'the row that survives is the name match',
  bothAnswers[0]?.title,
  'abort.sas'
)

// A query matching the searched folder's name must not turn every descendant into
// a name hit, masking its content snippet or admitting unrelated descendants.
const ancestorSources = {
  ...sources,
  files: ['/orders/run.sas', '/orders/other.sas', '/orders/orders.sas'],
  folders: ['/orders/archive', '/orders/orders-reports'],
  contents: [
    { path: '/orders/run.sas', text: 'first line\norders are ready' },
    { path: '/orders/other.sas', text: 'unrelated' },
    { path: '/orders/orders.sas', text: 'orders' }
  ]
}
const ancestorHits = matches('folder', 'orders', ancestorSources)
assert.deepEqual(
  ancestorHits.map(({ kind, title, detail }) => ({ kind, title, detail })),
  [
    { kind: 'folder', title: 'orders-reports', detail: '/orders' },
    { kind: 'file', title: 'orders.sas', detail: '/orders' },
    { kind: 'text', title: '/orders/run.sas', detail: 'line 2: orders are ready' }
  ],
  'folder search matches names and contents, not ancestor names'
)
assert.equal(matches('drive', 'orders', ancestorSources).length, 3,
  'header drive search retains ancestor-path matching')
assert.ok(matches('folder', '/orders/run', ancestorSources).some(
  (hit) => hit.filePath === '/orders/run.sas'
), 'an explicit path query can find a file')

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

// The box itself is not asserted in this file: it renders JSX, node cannot
// evaluate that, and matching its source text pins spellings rather than
// behaviour - a rename, or inlining `searchHint(scope)` in the placeholder,
// would fail the suite while the search went on working. The rendered box has
// its own suite; see the note at the end.
//
// What the component decides is the scope, and that is the pure function above.
// Everything the field then does with it - the placeholder and accessible name
// per screen, which lists it asks for, when the drive walk starts, what a result
// opens - is asserted in `test-search-browser.mjs`, which renders the component
// in Chromium with only its network mocked. This file is the rule; that one is
// the wiring.

if (failures.length) {
  console.error(`FAILED (${failures.length})`)
  for (const failure of failures) console.error(`  - ${failure}`)
  process.exit(1)
}

console.log(
  'search: scoped to the screen, everything on the dashboard, apps and drive files searched by their own fields'
)
