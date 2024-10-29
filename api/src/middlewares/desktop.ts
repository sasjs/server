import { RequestHandler, Request } from 'express'
import { userInfo } from 'os'
import { RequestUser } from '../types'
import { ModeType } from '../utils'

const regexUser = /^\/SASjsApi\/user\/[0-9]*$/ // /SASjsApi/user/1

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
  userId: '12345',
  clientId: 'desktop_app',
  username: userInfo().username,
  displayName: userInfo().username,
  isAdmin: true,
  isActive: true,
  needsToUpdatePassword: false
}
