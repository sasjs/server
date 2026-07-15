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
    nextFunction,
    process.secrets.ACCESS_TOKEN_SECRET,
    'accessToken'
  )
}

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
    if (await isPublicRoute(req)) {
      req.user = publicUser
      return next()
    }

    res.status(401).send('Unauthorized')
  }
}
