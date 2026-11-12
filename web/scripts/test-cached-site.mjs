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

const { cacheBust, clearCachedSite } =
  await import('../src/utils/cachedSite.ts')

const failures = []
const check = (label, condition) => {
  if (!condition) failures.push(label)
}

/** A host with the registrations and cache names a browser would report. */
const hostWith = ({
  registrations = [],
  caches = [],
  unregister = true
} = {}) => {
  const state = { unregistered: [], deleted: [], reloads: 0, went: '' }

  return {
    state,
    host: {
      serviceWorker: {
        getRegistrations: async () =>
          registrations.map((name) => ({
            name,
            unregister: async () => {
              if (!unregister) throw new Error('refused')
              state.unregistered.push(name)

              return true
            }
          }))
      },
      caches: {
        keys: async () => caches,
        delete: async (name) => {
          state.deleted.push(name)

          return true
        }
      },
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
  const wiped = await clearCachedSite(host)

  return { wiped, state }
}

const normal = await run({
  registrations: ['/', '/studio/'],
  caches: ['workbox-precache', 'assets']
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

const empty = await run()
check('a browser holding nothing still reloads', empty.state.reloads === 1)
check(
  'and reports nothing wiped',
  empty.wiped.workers === 0 && empty.wiped.caches === 0
)

const refused = await run({
  registrations: ['/'],
  caches: ['x'],
  unregister: false
})
check(
  'a refused unregister does not stop the caches',
  refused.state.deleted.join(',') === 'x'
)
check('and the page still reloads', refused.state.reloads === 1)
check('a refused worker is not counted', refused.wiped.workers === 0)

// A host with no worker at all (a server page) must not throw on the way to the
// reload - the button is hidden there, but the function is not allowed to assume it.
let bareReloaded = false
await clearCachedSite({
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
