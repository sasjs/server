/**
 * The "wipe the cached site" action, without a browser.
 *
 * The failure this guards is a page that half-wipes and does not reload: a
 * browser can refuse the service worker (a sandboxed frame, a policy), and an
 * action that stops there leaves the reader on the old page with nothing to show
 * for the click. So each step is attempted on its own and the reload always runs.
 *
 * Run with `npm run test:cachedsite`.
 */
import { registerHooks } from 'node:module'

import { tsResolverHooks } from './node-ts-resolver.mjs'

registerHooks(tsResolverHooks)

const { browserSite, cacheBust, clearSite } =
  await import('../src/utils/cachedSite.ts')

const failures = []
const check = (label, condition) => {
  if (!condition) failures.push(label)
}

/**
 * A host with the registrations and cache names a browser would report.
 *
 * `refuse` names the one registration and the one cache that reject, so a refusal
 * is a single item rather than the whole sweep - which is the case the code has
 * to survive, and the case a fixture with one of each cannot see.
 */
const hostWith = ({
  registrations = [],
  caches = [],
  refuseRegistration = '',
  refuseCache = '',
  refuseDatabase = '',
  databases = [],
  storage = true
} = {}) => {
  const state = {
    unregistered: [],
    deleted: [],
    dropped: [],
    clearLocal: 0,
    clearSession: 0,
    reloads: 0,
    went: ''
  }

  return {
    state,
    host: {
      serviceWorker: {
        getRegistrations: async () =>
          registrations.map((name) => ({
            name,
            unregister: async () => {
              if (name === refuseRegistration) throw new Error('refused')
              state.unregistered.push(name)

              return true
            }
          }))
      },
      caches: {
        keys: async () => caches,
        delete: async (name) => {
          state.deleted.push(name)
          if (name === refuseCache) throw new Error('refused')

          return true
        }
      },
      databases: {
        list: async () => databases,
        delete: async (name) => {
          state.dropped.push(name)
          if (name === refuseDatabase) throw new Error('refused')

          return true
        }
      },
      localStorage: storage
        ? {
            clear: () => {
              state.clearLocal++
            }
          }
        : undefined,
      sessionStorage: storage
        ? {
            clear: () => {
              state.clearSession++
            }
          }
        : undefined,
      href: 'https://demo.example/home?tab=all',
      navigate: (url) => {
        state.reloads++
        state.went = url
      }
    }
  }
}

const run = async (options) => {
  const { host, state } = hostWith(options)
  const wiped = await clearSite(host)

  return { wiped, state }
}

const normal = await run({
  registrations: ['/', '/studio/'],
  caches: ['workbox-precache', 'assets'],
  databases: ['sasjs-studio', 'sasjs-dashboard']
})

check(
  'every registration is unregistered',
  normal.state.unregistered.length === 2
)
check('and counted', normal.wiped.workers === 2)
check(
  'every cache is deleted',
  normal.state.deleted.join(',') === 'workbox-precache,assets'
)
check('and counted', normal.wiped.caches === 2)
check('the page is reloaded once', normal.state.reloads === 1)
check(
  'every database is deleted',
  normal.state.dropped.join(',') === 'sasjs-studio,sasjs-dashboard'
)
check('and counted', normal.wiped.databases === 2)
check(
  'local and session storage are both cleared',
  normal.state.clearLocal === 1 && normal.state.clearSession === 1
)
check('and reported', normal.wiped.stores === 2)

// A host whose `delete` refuses: the sweep must carry on past it. This tests the
// HOST refusing - the adapter's own handling of a blocked request is below, where
// IndexedDB itself is stubbed, because a fixture that throws cannot see it.
const blocked = await run({
  databases: ['held-open', 'free'],
  refuseDatabase: 'held-open'
})
check(
  'a blocked database does not abandon the next one',
  blocked.state.dropped.join(',') === 'held-open,free'
)
check('only what succeeded is counted', blocked.wiped.databases === 1)

const noStorage = await run({ storage: false })
check(
  'a host with no storage reports none wiped and still reloads',
  noStorage.wiped.stores === 0 && noStorage.state.reloads === 1
)

const empty = await run()
check('a browser holding nothing still reloads', empty.state.reloads === 1)
check(
  'and reports nothing wiped',
  empty.wiped.workers === 0 &&
    empty.wiped.caches === 0 &&
    empty.wiped.databases === 0
)

const refused = await run({
  registrations: ['/first/', '/second/'],
  caches: ['first-cache', 'second-cache'],
  refuseRegistration: '/first/',
  refuseCache: 'first-cache'
})
check(
  'a refused unregister does not abandon the next registration',
  refused.state.unregistered.join(',') === '/second/'
)
check(
  'a refused cache delete does not abandon the next cache',
  refused.state.deleted.join(',') === 'first-cache,second-cache'
)
check('only what succeeded is counted', refused.wiped.caches === 1)
check('and the page still reloads', refused.state.reloads === 1)
check(
  'only the registration that succeeded is counted',
  refused.wiped.workers === 1
)

// A host with no worker at all (a server page) must not throw on the way to the
// reload - the button is hidden there, but the function is not allowed to assume it.
let bareReloaded = false
await clearSite({
  href: 'https://demo.example/home',
  navigate: () => (bareReloaded = true)
})
check('a host with no serviceWorker or caches still reloads', bareReloaded)

// The address has to differ, or the browser answers from its own HTTP cache and
// nothing was gained by unregistering the worker.
check(
  'the page is left for a new address',
  normal.state.went.startsWith(
    'https://demo.example/home?tab=all&sasjs-cache-bust='
  )
)
check(
  'the new address keeps the screen and its own query',
  new URL(normal.state.went).searchParams.get('tab') === 'all'
)
check(
  'a second wipe on a busted address does not pile up',
  cacheBust('https://demo.example/home?sasjs-cache-bust=1', 2) ===
    'https://demo.example/home?sasjs-cache-bust=2'
)

// ---- the adapter's IndexedDB handling ---------------------------------------

// `deleteDatabase` answers a REQUEST, not a promise: success, `error` and
// `blocked` are events on it. The adapter turns the first into a resolve and the
// other two into a rejection, so `settle` skips that item and the sweep goes on -
// which is what the reviewer could not see from a fixture that threw.
const requests = []

globalThis.indexedDB = {
  databases: async () => [{ name: 'held-open' }, { name: 'free' }],
  deleteDatabase: (name) => {
    const request = {}

    requests.push(name)

    setTimeout(() => {
      if (name === 'held-open') request.onblocked?.()
      else request.onsuccess?.()
    }, 0)

    return request
  }
}

const adapterSite = browserSite()

check(
  'the adapter lists the databases a browser reports',
  JSON.stringify(await adapterSite.databases.list()) === '["held-open","free"]'
)
check(
  'a blocked delete rejects rather than resolving',
  await adapterSite.databases.delete('held-open').then(
    () => false,
    () => true
  )
)
check(
  'an allowed one resolves',
  await adapterSite.databases.delete('free').then(
    () => true,
    () => false
  )
)

// and through the sweep: the blocked one is not counted, the free one is
const viaAdapter = await clearSite({
  ...browserSite(),
  href: 'https://demo.example/home',
  navigate: () => void 0
})

check('a blocked database is not counted as wiped', viaAdapter.databases === 1)

globalThis.indexedDB = {
  databases: async () => [{ name: 'broken' }, { name: 'fine' }],
  deleteDatabase: (name) => {
    const request = {}

    setTimeout(() => {
      if (name === 'broken') {
        request.error = new Error('delete failed')
        request.onerror?.()
      } else request.onsuccess?.()
    }, 0)

    return request
  }
}

const viaError = await clearSite({
  ...browserSite(),
  href: 'https://demo.example/home',
  navigate: () => void 0
})

check('a failed delete is not counted either', viaError.databases === 1)

// ---- the browser adapter ---------------------------------------------------

// A browser that forbids storage throws on the property ACCESS. Read eagerly in
// `browserSite()` that throw lands outside every guard in `clearSite`, so the click
// would do nothing at all - the case the guard exists for.
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  get() {
    throw new Error('SecurityError')
  }
})
Object.defineProperty(globalThis, 'sessionStorage', {
  configurable: true,
  get() {
    throw new Error('SecurityError')
  }
})

let refusedHost = null
let refusedError = null

try {
  refusedHost = browserSite()
} catch (error) {
  refusedError = error
}

check(
  'a browser that refuses storage still yields a host',
  refusedHost !== null,
  refusedError ? `threw: ${refusedError.message}` : ''
)
check(
  'and the two stores are absent rather than throwing',
  refusedHost && !refusedHost.localStorage && !refusedHost.sessionStorage
)

if (refusedHost) {
  const wiped = await clearSite({
    ...refusedHost,
    href: 'https://demo.example/home',
    navigate: () => void 0
  })

  check('and the sweep reports no store wiped', wiped.stores === 0)
}

if (failures.length) {
  console.error(`cached site: ${failures.length} check(s) failed`)
  for (const failure of failures) console.error(`  - ${failure}`)
  process.exit(1)
}

console.log('cached site: all checks passed')
