// MODE has to be in place before the routers load: their utilities resolve the
// SASjs root from it, and the check reads the routers themselves
import '../api/spec/sessionEnv'
// the app module is what installs the process variables the routers resolve their
// folders from, so it loads before they do
import appPromise from '../../app'
import apiRouter, { API_MOUNTS } from '../api'
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
 * Operations that are mounted and deliberately not documented, with where that is
 * tracked. Empty is the goal; an entry here is a route published without a
 * contract, and the test fails if the list and the routes disagree in either
 * direction - so a stale entry cannot hide a fixed one, and a new gap cannot slip
 * in beside it.
 */
const UNDOCUMENTED_ON_PURPOSE: Record<string, string> = {
  // sasjs/server#672 - the App Stream surface is served by a hand-written router,
  // and the document is generated from the controllers, so this route has nowhere
  // to be stated until one of the two moves.
  'GET /SASjsApi/app/{id}': 'https://github.com/sasjs/server/issues/672'
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

    // every exemption is still a mounted route: one that has been documented, or
    // removed, has to leave this list too
    for (const exempt of Object.keys(UNDOCUMENTED_ON_PURPOSE))
      expect(undocumented).toContain(exempt)

    expect(undocumented.filter((o) => !(o in UNDOCUMENTED_ON_PURPOSE))).toEqual(
      []
    )
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
