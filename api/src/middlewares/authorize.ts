import { RequestHandler } from 'express'
import { Request, Response } from 'express'
import User from '../model/User'
import { isGrantedForRequest, isPublicRoute } from '../utils'
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

/**
 * The permission gate. The rules themselves live in `routeAccess`, which the
 * web interface also reads, so the routes it offers and the routes this admits
 * cannot disagree.
 *
 * Administrators bypass the rules, and a public route is admitted before them.
 */
export const authorize: RequestHandler = async (req, res, next) => {
  const { user } = req

  if (!user) return sendPermissionDenied(req, res)

  // no need to check for permissions when user is admin
  if (user.isAdmin) return next()

  // no need to check for permissions when route is Public
  if (await isPublicRoute(req)) return next()

  const dbUser = await User.findOne({ _id: user.userId })
  if (!dbUser) return sendPermissionDenied(req, res)

  if (await isGrantedForRequest(dbUser, req)) return next()

  return sendPermissionDenied(req, res)
}
