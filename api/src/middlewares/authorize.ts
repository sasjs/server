import { RequestHandler } from 'express'
import User from '../model/User'
import Permission from '../model/Permission'
import { PermissionSetting } from '../controllers/permission'

export const authorize: RequestHandler = async (req, res, next) => {
  let permission
  const user = req.user
  if (user) {
    // no need to check for permissions when user is admin
    if (user.isAdmin) return next()

    const dbUser = await User.findOne({ id: user.userId })
    if (!dbUser) return res.sendStatus(401)

    const uri = req.baseUrl + req.route.path

    // find permission w.r.t user
    permission = await Permission.findOne({ uri, user: dbUser._id })

    if (permission) {
      if (permission.setting === PermissionSetting.grant) return next()
      else res.sendStatus(401)
    }

    // find permission w.r.t user's groups
    for (const group of dbUser.groups) {
      permission = await Permission.findOne({ uri, group })
      if (permission && permission.setting === PermissionSetting.grant)
        return next()
    }

    return res.sendStatus(401)
  }
  return res.sendStatus(401)
}
