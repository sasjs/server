import { Request } from 'express'
import Permission from '../model/Permission'
import Group, { PUBLIC_GROUP_NAME } from '../model/Group'
import { IUserDocument } from '../model/User'
import {
  PermissionSettingForRoute,
  PermissionType
} from '../controllers/permission'
import {
  TopLevelRoutes,
  canonicalizeRoutePath,
  getAuthorizedRoutes,
  getPath
} from './getAuthorizedRoutes'

export interface RouteRule {
  path: string
  setting: string
}

/**
 * Every route rule that can bear on one caller: the rules addressed to the user
 * and the rules addressed to the groups the user is in.
 */
export interface RouteRules {
  user: RouteRule[]
  group: RouteRule[]
}

/**
 * The top-level route that governs a request, which is the mounted router
 * prefix: `/SASjsApi/code/execute` is governed by `/SASjsApi` and
 * `/AppStream/Mario` by `/AppStream`. A rule on the top-level route applies to
 * everything beneath it.
 *
 * This mirrors what `req.baseUrl` holds for the same request, so a caller
 * evaluating a route from the inventory reaches the same answer as the
 * middleware seeing that route requested.
 */
export const topLevelRouteFor = (routePath: string): string =>
  TopLevelRoutes.find((route) =>
    routePath.toLowerCase().startsWith(route.toLowerCase())
  ) ?? canonicalizeRoutePath(routePath)

/**
 * Loads the rules for one caller in two queries.
 *
 * The middleware gate and the web interface both decide from this, so they
 * cannot drift apart - which is the whole point: a route the interface offers
 * and the gate refuses is the bug the interface is meant to avoid. Loading the
 * rules once also keeps a caller that evaluates every route in the inventory
 * to two queries rather than two per route.
 */
export const loadRouteRules = async (
  dbUser: IUserDocument
): Promise<RouteRules> => {
  const [user, group] = await Promise.all([
    Permission.find({ type: PermissionType.route, user: dbUser._id }),
    Permission.find({
      type: PermissionType.route,
      group: { $in: dbUser.groups }
    })
  ])

  return {
    user: user.map(({ path, setting }) => ({ path, setting })),
    group: group.map(({ path, setting }) => ({ path, setting }))
  }
}

/**
 * The paths granted to the reserved `public` group. A public grant admits any
 * caller, and it is checked before the rules, so no user or group rule can take
 * it away.
 */
export const getPublicRoutePaths = async (): Promise<string[]> => {
  const group = await Group.findOne({ name: PUBLIC_GROUP_NAME })
  if (!group) return []

  const permissions = await Permission.find({
    group: group._id,
    setting: PermissionSettingForRoute.grant
  })

  return permissions.map((permission) => permission.path)
}

const settingOn = (rules: RouteRule[], path: string): string | undefined =>
  rules.find((rule) => rule.path === path)?.setting

/**
 * Whether these rules grant a caller access to `path`.
 *
 * The order is the documented one, and it is the only implementation of it:
 * both the middleware gate and the interface read their answer from here.
 *
 *   1. a rule addressed to the user on the path itself decides either way
 *   2. otherwise a rule addressed to the user on the top-level route decides
 *   3. otherwise a group grant on the path allows, and a group deny on the path
 *      blocks the top-level check - but a grant from another group still allows
 *   4. otherwise a group grant on the top-level route allows
 *   5. otherwise denied
 *
 * A grant beats a deny at the same level, which is why step 3 looks at every
 * group rule rather than stopping at the first deny.
 */
export const isRouteGranted = (
  rules: RouteRules,
  path: string,
  topLevelRoute: string
): boolean => {
  const userSetting =
    settingOn(rules.user, path) ?? settingOn(rules.user, topLevelRoute)

  if (userSetting) return userSetting === PermissionSettingForRoute.grant

  const onPath = rules.group.filter((rule) => rule.path === path)

  if (onPath.some((rule) => rule.setting === PermissionSettingForRoute.grant))
    return true

  if (onPath.some((rule) => rule.setting === PermissionSettingForRoute.deny))
    return false

  return rules.group.some(
    (rule) =>
      rule.path === topLevelRoute &&
      rule.setting === PermissionSettingForRoute.grant
  )
}

/**
 * Whether a request would pass the permission gate. Administrators and public
 * routes are handled by the middleware before it gets here, because both need
 * the request rather than the user.
 */
export const isGrantedForRequest = async (
  dbUser: IUserDocument,
  req: Request
): Promise<boolean> => {
  const rules = await loadRouteRules(dbUser)

  return isRouteGranted(rules, getPath(req), topLevelRouteFor(req.baseUrl))
}

/**
 * The subset of `routes` this caller may use.
 *
 * Administrators hold every route - the rules do not apply to them - and a
 * public grant is included for everyone.
 */
export const filterGrantedRoutes = async (
  dbUser: IUserDocument,
  routes: string[]
): Promise<string[]> => {
  if (dbUser.isAdmin) return routes

  const [rules, publicPaths] = await Promise.all([
    loadRouteRules(dbUser),
    getPublicRoutePaths()
  ])

  return routes.filter(
    (route) =>
      publicPaths.includes(route) ||
      isRouteGranted(rules, route, topLevelRouteFor(route))
  )
}

/**
 * The routes from the permission inventory this caller may use.
 */
export const getGrantedRoutes = async (
  dbUser: IUserDocument
): Promise<string[]> => filterGrantedRoutes(dbUser, getAuthorizedRoutes())
