import { RequestHandler, Request } from 'express'
import { ModeType } from '../utils'
import { DESKTOP_USER_ID } from '../utils/desktopIdentity'

// The desktop account's id is the operating system's for the user running the server:
// numeric on Linux and macOS; on Windows Node answers -1 and does not expose the SID, so
// the account name is used, and a directory account can answer `DOMAIN\name`. The guard
// never assumed otherwise in spirit - the point is "your own profile only" - but it was
// written as `[0-9]*` against the old '12345' sentinel, which would have refused a Windows
// desktop outright, its id being a name there rather than a number.
const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const regexUser = new RegExp(
  `^/SASjsApi/user/${escapeRegExp(DESKTOP_USER_ID)}/?$`
)

// Desktop mode has no login/logout - every request resolves through `desktopCaller()`
// against the identity store, which is one account and no credentials - but the desktop UI
// still needs to read/update that account's own profile (e.g. autoExec), so these two routes
// stay reachable while every other /SASLogon/* and user-management route is blocked below.
const allowedInDesktopMode: { [key: string]: RegExp[] } = {
  GET: [regexUser],
  PATCH: [regexUser]
}

const reqAllowedInDesktopMode = (request: Request): boolean => {
  const { method, originalUrl } = request
  // the query is not part of the route, and a profile read may carry one
  const url = originalUrl.split('?')[0]

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

// The account itself is declared once, in utils/desktopIdentity, and every consumer reads it
// through `desktopCaller()` - the middlewares, the profile routes and the session directory.
// There is deliberately no summary exported from here to drift from it.
