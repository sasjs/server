import { RequestHandler } from 'express'
import { Request, Response } from 'express'
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
import { drainBody } from './drainBody'

/**
 * Refuses a caller who is authenticated but has no grant on the route.
 *
 * The body is drained first: this runs before multer, so a refused upload is
 * still on the wire and answering it immediately resets the connection under
 * the client (see drainBody). The decision comes from the permission records,
 * never from the body.
 */
const sendPermissionDenied = async (req: Request, res: Response) => {
  await drainBody(req)

  return res.sendStatus(401)
}

export const authorize: RequestHandler = async (req, res, next) => {
  const { user } = req

  if (!user) return sendPermissionDenied(req, res)

  // no need to check for permissions when user is admin
  if (user.isAdmin) return next()

  // no need to check for permissions when route is Public
  if (await isPublicRoute(req)) return next()

  const dbUser = await User.findOne({ _id: user.userId })
  if (!dbUser) return sendPermissionDenied(req, res)

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
    else return sendPermissionDenied(req, res)
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
    else return sendPermissionDenied(req, res)
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

  return sendPermissionDenied(req, res)
}
