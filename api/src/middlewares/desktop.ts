import { RequestHandler, Request } from 'express'
import { userInfo } from 'os'
import { RequestUser } from '../types'
import { ModeType } from '../utils'

const regexUser = /^\/SASjsApi\/user\/[0-9]*$/ // /SASjsApi/user/1

// Desktop mode has no login/logout (see authenticateAccessToken's desktop
// bypass) and every request runs as the single fixed desktopUser, but the
// desktop UI still needs to read/update that user's own profile (e.g.
// autoExec) - so these two routes stay reachable while every other
// /SASLogon/* and user-management route is blocked below.
const allowedInDesktopMode: { [key: string]: RegExp[] } = {
  GET: [regexUser],
  PATCH: [regexUser]
}

const reqAllowedInDesktopMode = (request: Request): boolean => {
  const { method, originalUrl: url } = request

  return !!allowedInDesktopMode[method]?.find((urlRegex) => urlRegex.test(url))
}

export const desktopRestrict: RequestHandler = (req, res, next) => {
  const { MODE } = process.env

  if (MODE === ModeType.Desktop) {
    if (!reqAllowedInDesktopMode(req))
      return res.status(403).send('Not Allowed while in Desktop Mode.')
  }

  next()
}

export const desktopUser: RequestUser = {
  userId: 12345,
  clientId: 'desktop_app',
  username: userInfo().username,
  displayName: userInfo().username,
  isAdmin: true,
  isActive: true,
  needsToUpdatePassword: false
}
