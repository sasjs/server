import { RequestHandler } from 'express'
import User from '../model/User'
import Permission from '../model/Permission'
import {
  PermissionSettingForRoute,
  PermissionType
} from '../controllers/permission'
import {
  getPath,
  isPublicRoute,
  TopLevelRoutes,
  canonicalizeRoutePath
} from '../utils'

export const authorize: RequestHandler = async (req, res, next) => {
  const { user } = req

  if (!user) return res.sendStatus(401)

  // no need to check for permissions when user is admin
  if (user.isAdmin) return next()

  // no need to check for permissions when route is Public
  if (await isPublicRoute(req)) return next()

  const dbUser = await User.findOne({ _id: user.userId })
  if (!dbUser) return res.sendStatus(401)

  const path = getPath(req)
  const { baseUrl } = req
  // Same case-insensitivity concern as getPath above: a request to /SASJSAPI/*
  // must still resolve to the canonical top-level route ('/SASjsApi') when
  // checking top-level Permission grants.
  const topLevelRoute =
    TopLevelRoutes.find((route) =>
      baseUrl.toLowerCase().startsWith(route.toLowerCase())
    ) || canonicalizeRoutePath(baseUrl)

  // find permission w.r.t user
  const permission = await Permission.findOne({
    path,
    type: PermissionType.route,
    user: dbUser._id
  })

  if (permission) {
    if (permission.setting === PermissionSettingForRoute.grant) return next()
    else return res.sendStatus(401)
  }

  // find permission w.r.t user on top level
  const topLevelPermission = await Permission.findOne({
    path: topLevelRoute,
    type: PermissionType.route,
    user: dbUser._id
  })

  if (topLevelPermission) {
    if (topLevelPermission.setting === PermissionSettingForRoute.grant)
      return next()
    else return res.sendStatus(401)
  }

  let isPermissionDenied = false

  // find permission w.r.t user's groups
  for (const group of dbUser.groups) {
    const groupPermission = await Permission.findOne({
      path,
      type: PermissionType.route,
      group
    })

    if (groupPermission) {
      if (groupPermission.setting === PermissionSettingForRoute.grant) {
        return next()
      } else {
        isPermissionDenied = true
      }
    }
  }

  if (!isPermissionDenied) {
    // find permission w.r.t user's groups on top level
    for (const group of dbUser.groups) {
      const groupPermission = await Permission.findOne({
        path: topLevelRoute,
        type: PermissionType.route,
        group
      })
      if (groupPermission?.setting === PermissionSettingForRoute.grant)
        return next()
    }
  }

  return res.sendStatus(401)
}
