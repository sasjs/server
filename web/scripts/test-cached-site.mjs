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

const { cacheBust, clearSite } = await import('../src/utils/cachedSite.ts')

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

// A tab that holds a database open answers `blocked` rather than deleting: the
// adapter resolves it, and the sweep continues.
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

if (failures.length) {
  console.error(`cached site: ${failures.length} check(s) failed`)
  for (const failure of failures) console.error(`  - ${failure}`)
  process.exit(1)
}

console.log('cached site: all checks passed')
