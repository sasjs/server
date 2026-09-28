import { RouteRules, isRouteGranted, topLevelRouteFor } from '../routeAccess'

const GRANT = 'Grant'
const DENY = 'Deny'

const rules = (
  user: [string, string][] = [],
  group: [string, string][] = []
): RouteRules => ({
  user: user.map(([path, setting]) => ({ path, setting })),
  group: group.map(([path, setting]) => ({ path, setting }))
})

describe('topLevelRouteFor', () => {
  it('maps a route to the router prefix that governs it', () => {
    expect(topLevelRouteFor('/SASjsApi/code/execute')).toEqual('/SASjsApi')
    expect(topLevelRouteFor('/AppStream/Mario')).toEqual('/AppStream')
    expect(topLevelRouteFor('/AppStream')).toEqual('/AppStream')
  })
})

/**
 * The precedence, one case at a time. The middleware gate and the web interface
 * both decide from this function, so these are the rules as the interface
 * offers them AND as the gate enforces them.
 */
describe('isRouteGranted', () => {
  const path = '/SASjsApi/code/execute'
  const topLevel = '/SASjsApi'

  it('denies when nothing grants the route', () => {
    expect(isRouteGranted(rules(), path, topLevel)).toEqual(false)
  })

  it('allows on a user grant for the route itself', () => {
    expect(isRouteGranted(rules([[path, GRANT]]), path, topLevel)).toEqual(true)
  })

  it('denies on a user deny for the route itself', () => {
    expect(isRouteGranted(rules([[path, DENY]]), path, topLevel)).toEqual(false)
  })

  it('allows on a user grant for the top-level route', () => {
    expect(isRouteGranted(rules([[topLevel, GRANT]]), path, topLevel)).toEqual(
      true
    )
  })

  it('denies on a user deny for the top-level route', () => {
    expect(isRouteGranted(rules([[topLevel, DENY]]), path, topLevel)).toEqual(
      false
    )
  })

  it('lets a user rule decide over a group rule', () => {
    expect(
      isRouteGranted(rules([[path, DENY]], [[path, GRANT]]), path, topLevel)
    ).toEqual(false)

    expect(
      isRouteGranted(rules([[path, GRANT]], [[path, DENY]]), path, topLevel)
    ).toEqual(true)
  })

  it('lets a user top-level deny beat a group grant on the route', () => {
    expect(
      isRouteGranted(rules([[topLevel, DENY]], [[path, GRANT]]), path, topLevel)
    ).toEqual(false)
  })

  it('allows on a group grant for the route', () => {
    expect(isRouteGranted(rules([], [[path, GRANT]]), path, topLevel)).toEqual(
      true
    )
  })

  it('denies on a group deny for the route', () => {
    expect(isRouteGranted(rules([], [[path, DENY]]), path, topLevel)).toEqual(
      false
    )
  })

  it('lets a group grant beat another group deny on the same route', () => {
    expect(
      isRouteGranted(
        rules(
          [],
          [
            [path, DENY],
            [path, GRANT]
          ]
        ),
        path,
        topLevel
      )
    ).toEqual(true)
  })

  it('blocks the top-level group grant when a group denies the route', () => {
    expect(
      isRouteGranted(
        rules(
          [],
          [
            [path, DENY],
            [topLevel, GRANT]
          ]
        ),
        path,
        topLevel
      )
    ).toEqual(false)
  })

  it('allows on a group grant for the top-level route', () => {
    expect(
      isRouteGranted(rules([], [[topLevel, GRANT]]), path, topLevel)
    ).toEqual(true)
  })

  it('ignores rules aimed at other routes', () => {
    expect(
      isRouteGranted(
        rules([['/SASjsApi/drive/file', GRANT]], [['/AppStream/Mario', GRANT]]),
        path,
        topLevel
      )
    ).toEqual(false)
  })
})
