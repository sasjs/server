import { RequestHandler } from 'express'
import User from '../model/User'
import Permission from '../model/Permission'
import { PermissionSetting } from '../controllers/permission'
import { getUri } from '../utils'

export const authorize: RequestHandler = async (req, res, next) => {
  const { user } = req

  if (!user) {
    return res.sendStatus(401)
  }

  // no need to check for permissions when user is admin
  if (user.isAdmin) return next()

  const dbUser = await User.findOne({ id: user.userId })
  if (!dbUser) return res.sendStatus(401)

  const uri = getUri(req)

  // find permission w.r.t user
  const permission = await Permission.findOne({ uri, user: dbUser._id })

  if (permission) {
    if (permission.setting === PermissionSetting.grant) return next()
    else return res.sendStatus(401)
  }

  // find permission w.r.t user's groups
  for (const group of dbUser.groups) {
    const groupPermission = await Permission.findOne({ uri, group })
    if (groupPermission?.setting === PermissionSetting.grant) return next()
  }
  return res.sendStatus(401)
}
