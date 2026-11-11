// MODE has to be in place before the routers load: their utilities resolve the
// SASjs root from it, and the check reads the routers themselves
import '../api/spec/sessionEnv'
// the app module is what installs the process variables the routers resolve their
// folders from, so it loads before they do
import appPromise from '../../app'
import apiRouter, { API_MOUNTS, ApiMount } from '../api'
import {
  authenticateAccessToken,
  authenticateRefreshToken,
  verifyAdmin
} from '../../middlewares'

/**
 * The middleware that refuses a caller without a credential.
 *
 * Three of them rather than one: an access token is the usual requirement, the refresh
 * exchange takes a refresh token instead, and `verifyAdmin` answers 401 to anyone it
 * cannot identify. A route behind any of them needs credentials, which is what the
 * document's `security` states.
 */
const AUTHENTICATORS = [
  authenticateAccessToken,
  authenticateRefreshToken,
  verifyAdmin
]
import { API_PREFIX } from '../../utils/routePrefixes'
import { Operation, documentedOperations } from './documentOperations'

/**
 * Every operation mounted under the API prefix is one the document states.
 *
 * The other half of the check in `documentedRoutes.spec.ts`, and the half the
 * document cannot enforce on its own. That one proves the document does not
 * promise a route the app does not answer. This one proves the app does not
 * answer a route the document does not promise - which is how a route gets
 * published without a contract: a handler is added to a router, the decorators
 * are forgotten, the API answers it, and nothing that reads the document can
 * know it exists.
 *
 * Read from the routers themselves rather than by probing, because a route that
 * is nowhere in the document gives no URL to probe. `API_MOUNTS` is the table the
 * api router is built from, so walking it covers exactly what is mounted.
 */
const toDocumentForm = (route: string): string =>
  // express states a parameter as `:name`, the document as `{name}`
  route.replace(/:([A-Za-z0-9_]+)/g, '{$1}')

/** A router's own paths, without the trailing slash none of them are stated with. */
const withoutTrailingSlash = (route: string): string =>
  route.length > 1 ? route.replace(/\/+$/, '') : ''

/**
 * The mounts inside a mounted router, which this walk cannot see.
 *
 * Express matches a nested `router.use('/sub', subRouter)` by a matcher, not by a
 * path this can read back, so a router whose paths are declared one level deeper
 * would register operations that never reach the comparison - the same
 * published-without-a-contract route the check exists to catch, hidden inside it.
 * Reported rather than skipped, so adding one fails loudly and the walk gets
 * extended instead of quietly under-reporting. A middleware layer - `guards` - has
 * a function for a handle and is not one of these.
 */
const nestedMounts = (): string[] =>
  API_MOUNTS.flatMap((mount) =>
    (mount.router as any).stack
      .filter(
        (layer: any) => !layer.route && Array.isArray(layer.handle?.stack)
      )
      .map((layer: any) => `${mount.path}: ${layer.name}`)
  )

const mountedOperations = (): Operation[] => {
  const operations: Operation[] = []

  for (const mount of API_MOUNTS) {
    for (const layer of (mount.router as any).stack) {
      const route = layer.route

      // middleware, or a nested mount - which `nestedMounts()` reports
      if (!route) continue

      for (const method of Object.keys(route.methods))
        operations.push({
          method: method.toUpperCase(),
          path: `${API_PREFIX}${mount.path}${withoutTrailingSlash(
            toDocumentForm(route.path)
          )}`
        })
    }
  }

  return operations
}

/**
 * Anything the api router carries that is not one of its mounts.
 *
 * The walk below reads `API_MOUNTS`, which is the table the router is built from -
 * but the router itself is a file anyone can add a line to. A `router.get('/x', ...)`
 * written beside the `forEach` is mounted under the API prefix, absent from the
 * document, and invisible to a walk that only reads the table: the
 * published-without-a-contract route this check exists to catch, sitting in the one
 * place it cannot see.
 *
 * Express keeps a mount as a layer whose `handle` is the router, and a route as a
 * layer with a `route`. No `route` layer means nothing is declared beside the table.
 */
const besideTheTable = (): string[] =>
  ((apiRouter as any).stack as any[])
    .filter((layer) => layer.route)
    .map(
      (layer) =>
        `${Object.keys(layer.route.methods)
          .join('|')
          .toUpperCase()} ${layer.route.path}`
    )

describe('the mounted operations', () => {
  beforeAll(async () => {
    await appPromise
  })

  it('are all in the document, not only in the routers', () => {
    const mounted = mountedOperations()
    const documented = new Set(
      documentedOperations().map((o) => `${o.method} ${o.path}`)
    )

    // a walk that found nothing would pass an empty list of extras, so the walk
    // is held to a count and to one operation known to be mounted
    expect(mounted.length).toBeGreaterThan(40)
    expect(mounted.map((o) => `${o.method} ${o.path}`)).toContain(
      'POST /SASjsApi/code/execute'
    )

    const undocumented = mounted
      .map((o) => `${o.method} ${o.path}`)
      .filter((o) => !documented.has(o))
      .sort()

    // nothing is exempt: every operation mounted under the API prefix is stated in
    // the document, and a route that is not fails here by name
    expect(undocumented).toEqual([])
  })

  it('state credentials everywhere but where the API is genuinely open', () => {
    // A guard is not always on the mount: nineteen of the documented operations sit
    // behind `authenticateAccessToken` on the handler itself - the user and group
    // routers, auth's refresh/logout/updatePassword, info/myAuthorizedRoutes - and a
    // walk of the mount table cannot see those. So this is asserted over the
    // document: an operation may state `security: []` only if it is on this list, and
    // everything on this list still has to be stated as open. Both directions, so a
    // route that quietly becomes public and one that quietly stops being public are
    // both a failure, and an addition here is a deliberate edit with a reason.
    const PUBLIC_OPERATIONS = [
      'POST /SASjsApi/auth/token', // the sign-in exchange itself
      'GET /SASjsApi/info', // mode/runTimes/authProviders, read before anyone signs in
      'GET /', // the interface shell
      'POST /SASLogon/login',
      'POST /SASLogon/authorize',
      'GET /SASLogon/logout'
    ]

    const documented = documentedOperations()
    const label = (operation: Operation) =>
      `${operation.method} ${operation.path}`

    const open = documented
      .filter((operation) => operation.secured === false)
      .map(label)
      .sort()

    expect(open).toEqual([...PUBLIC_OPERATIONS].sort())

    // and the complement, so "says nothing" cannot pass: an operation that states no
    // `security` key at all is neither open nor secured, and would satisfy the
    // assertion above while telling a client nothing about credentials
    const silent = documented
      .filter((operation) => !PUBLIC_OPERATIONS.includes(label(operation)))
      .filter((operation) => operation.secured !== true)
      .map(label)
      .sort()

    expect(silent).toEqual([])
  })

  it('are secured exactly where their route requires a token', () => {
    // The test above compares the document against a list somebody keeps. This one
    // compares it against the routers: a mount's `guards`, and the handler chain each
    // route registers. Without it, removing `authenticateAccessToken` from a mount
    // leaves both tests green - the route is open and the document still promises a
    // bearer requirement - which is the reverse of the defect this file was written for
    // and just as invisible.
    const carriesToken = (mount: ApiMount, layer: any): boolean =>
      (mount.guards ?? []).some((guard) => AUTHENTICATORS.includes(guard)) ||
      layer.route.stack.some((entry: any) =>
        AUTHENTICATORS.includes(entry.handle)
      )

    const documented = new Map(
      documentedOperations().map((o) => [`${o.method} ${o.path}`, o])
    )

    const mismatched: string[] = []

    for (const mount of API_MOUNTS) {
      for (const layer of (mount.router as any).stack) {
        if (!layer.route) continue

        const requiresToken = carriesToken(mount, layer)

        for (const method of Object.keys(layer.route.methods)) {
          const path = `${API_PREFIX}${mount.path}${withoutTrailingSlash(
            toDocumentForm(layer.route.path)
          )}`
          const label = `${method.toUpperCase()} ${path}`
          const entry = documented.get(label)

          if (!entry) continue

          if ((entry.secured === true) !== requiresToken) mismatched.push(label)
        }
      }
    }

    expect(mismatched.sort()).toEqual([])
  })

  it('are mounted through the table, and only through it', () => {
    // a route declared on the api router itself, or a mount beside the table, would
    // be answered under the API prefix and never reach the comparison above - so
    // the table has to be the whole of it, not the part of it this file can read
    expect(besideTheTable()).toEqual([])

    // `router.use(path, guard, guard, router)` lays down one layer per handler, so
    // the count is of layers that carry a router, not of layers on the stack
    const mountedRouters = ((apiRouter as any).stack as any[]).filter(
      (layer) => !layer.route && Array.isArray(layer.handle?.stack)
    )

    expect(mountedRouters.length).toBe(API_MOUNTS.length)
  })

  it('are declared on the routers themselves, not a level below them', () => {
    // this walk reads one level down and no further, so a nested mount would be
    // invisible to it - see nestedMounts()
    expect(nestedMounts()).toEqual([])
  })

  it('are each stated once', () => {
    // two routers carrying the same path would answer in whichever order they are
    // mounted, and the document could not say which - the same uniqueness the
    // document is held to in the other direction
    const mounted = mountedOperations().map((o) => `${o.method} ${o.path}`)

    expect(mounted).toEqual(Array.from(new Set(mounted)))
  })
})
