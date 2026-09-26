import { RequestHandler, Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { csrfProtection } from './'
import {
  fetchLatestAutoExec,
  ModeType,
  verifyTokenInDB,
  isAuthorizingRoute,
  isPublicRoute,
  publicUser
} from '../utils'
import { desktopUser } from './desktop'
import { authorize } from './authorize'

export const authenticateAccessToken: RequestHandler = async (
  req,
  res,
  next
) => {
  const { MODE } = process.env
  if (MODE === ModeType.Desktop) {
    req.user = desktopUser
    return next()
  }

  const nextFunction = isAuthorizingRoute(req)
    ? () => authorize(req, res, next)
    : next

  // if request is coming from web and has valid session
  // it can be validated.
  if (req.session?.loggedIn) {
    if (req.session.user) {
      const user = await fetchLatestAutoExec(req.session.user)

      if (user) {
        if (user.isActive) {
          // A user flagged as still on their initial/assigned password can
          // do nothing through the API until it is changed - not even as an
          // admin. Previously this flag was advisory (only the SPA honoured
          // it), which made the seeded admin's initial password fully
          // usable server-side against every route.
          if (
            user.needsToUpdatePassword &&
            isInitialAdminPasswordEnforced(user.username) &&
            !isPasswordChangeRoute(req)
          ) {
            return res.status(403).send('Password update required')
          }

          req.user = user
          return csrfProtection(req, res, nextFunction)
        } else return res.status(401).send('Unauthorized')
      }
    }
    return res.status(401).send('Unauthorized')
  }

  await authenticateToken(
    req,
    res,
    (err?: unknown) => {
      if (err) return next(err)

      // Same enforcement on the bearer-token path as on the session path.
      if (
        req.user &&
        req.user.needsToUpdatePassword &&
        isInitialAdminPasswordEnforced(req.user.username) &&
        !isPasswordChangeRoute(req)
      ) {
        return res.status(403).send('Password update required')
      }

      return nextFunction()
    },
    process.secrets.ACCESS_TOKEN_SECRET,
    'accessToken'
  )
}

/**
 * The only routes a password-flagged account may reach: reading its own
 * session (the SPA's session poll), changing its password, and logging out.
 */
const isPasswordChangeRoute = (req: Request): boolean => {
  const p = req.baseUrl + req.path
  return (
    p.startsWith('/SASjsApi/auth/updatePassword') ||
    p.startsWith('/SASjsApi/session') ||
    p.startsWith('/SASLogon/logout')
  )
}

/**
 * Whether the needsToUpdatePassword flag is a HARD gate for this user.
 *
 * For the SEEDED admin - the account seedDB creates from ADMIN_USERNAME /
 * ADMIN_PASSWORD_INITIAL - it is: that password is assigned by configuration
 * (and historically defaulted to a publicly-known value), so until it is
 * changed the account can do nothing but change it. The account is
 * identified by the configured admin username, which is stable: the only
 * way to clear the flag is to change the password, and by then the gate is
 * open.
 *
 * For ordinary admin-created users the flag stays ADVISORY (the SPA prompts;
 * nothing forces a change). Enforcing it there would break headless service
 * accounts on their first login - a deliberate compatibility decision.
 */
const isInitialAdminPasswordEnforced = (username: string): boolean =>
  username === process.env.ADMIN_USERNAME

export const authenticateRefreshToken: RequestHandler = async (
  req,
  res,
  next
) => {
  await authenticateToken(
    req,
    res,
    next,
    process.secrets.REFRESH_TOKEN_SECRET,
    'refreshToken'
  )
}

const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
  key: string,
  tokenType: 'accessToken' | 'refreshToken'
) => {
  const { MODE } = process.env
  if (MODE === ModeType.Desktop) {
    req.user = {
      userId: '1234',
      clientId: 'desktopModeClientId',
      username: 'desktopModeUsername',
      displayName: 'desktopModeDisplayName',
      isAdmin: true,
      isActive: true,
      needsToUpdatePassword: false
    }
    req.accessToken = 'desktopModeAccessToken'
    return next()
  }

  const authHeader = req.headers['authorization']
  const token = authHeader?.split(' ')[1]

  try {
    if (!token) throw 'Unauthorized'

    const data: any = jwt.verify(token, key)

    const user = await verifyTokenInDB(
      data?.userId,
      data?.clientId,
      token,
      tokenType
    )

    if (user) {
      if (user.isActive) {
        req.user = user
        if (tokenType === 'accessToken') req.accessToken = token
        return next()
      } else throw 'Unauthorized'
    }

    throw 'Unauthorized'
  } catch (error) {
    // A missing/invalid/expired token doesn't necessarily mean 401 - if an
    // admin has granted the built-in Public group access to this exact
    // path, an unauthenticated caller still gets through as publicUser.
    if (await isPublicRoute(req)) {
      req.user = publicUser
      return next()
    }

    res.status(401).send('Unauthorized')
  }
}
