import type { AppStreamEntry } from '@sasjs/api'

import { appDecidingPath } from './appStreamConfig'
import { APP_STREAM_PREFIX } from './routePrefixes'
import { isRouteGranted, type RouteRules } from './routeAccess'

/**
 * Whether these rules grant a caller one app.
 *
 * The paths an app may be granted on, and the order in which they decide, are
 * `appDecidingPath`'s - the same answer the permission gate reaches for a
 * request on the app's URL. The top-level route for both paths is
 * `/AppStream`, so a grant on the stream as a whole admits every app and a rule
 * on the app itself narrows it, exactly as `isRouteGranted` decides every other
 * route.
 */
export const appIsGranted = (
  entry: AppStreamEntry,
  rules: RouteRules
): boolean =>
  isRouteGranted(rules, appDecidingPath(entry, rules), APP_STREAM_PREFIX)
