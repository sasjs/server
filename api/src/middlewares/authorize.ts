import { RequestHandler } from 'express'
import User from '../model/User'
import Permission from '../model/Permission'
import {
  PermissionSettingForRoute,
  PermissionType
} from '../controllers/permission'
import { getPath, isPublicRoute } from '../utils'

export const authorize: RequestHandler = async (req, res, next) => {
  const { user } = req

  if (!user) {
    return res.sendStatus(401)
  }

  // no need to check for permissions when user is admin
  if (user.isAdmin) return next()

  // no need to check for permissions when route is Public
  if (await isPublicRoute(req)) return next()

  const dbUser = await User.findOne({ id: user.userId })
  if (!dbUser) return res.sendStatus(401)

  const path = getPath(req)

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

  // find permission w.r.t user's groups
  for (const group of dbUser.groups) {
    const groupPermission = await Permission.findOne({
      path,
      type: PermissionType.route,
      group
    })
    if (groupPermission?.setting === PermissionSettingForRoute.grant)
      return next()
  }
  return res.sendStatus(401)
}
