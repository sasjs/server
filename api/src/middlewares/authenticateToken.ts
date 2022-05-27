import { RequestHandler, Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { csrfProtection } from '../app'
import { fetchLatestAutoExec, ModeType, verifyTokenInDB } from '../utils'
import { desktopUser } from './desktop'

export const authenticateAccessToken: RequestHandler = async (
  req,
  res,
  next
) => {
  const { MODE } = process.env
  if (MODE === ModeType.Server) {
    req.user = desktopUser
    return next()
  }

  // if request is coming from web and has valid session
  // it can be validated.
  if (req.session?.loggedIn) {
    if (req.session.user) {
      const user = await fetchLatestAutoExec(req.session.user)

      if (user) {
        if (user.isActive) {
          req.user = user
          return csrfProtection(req, res, next)
        } else return res.sendStatus(401)
      }
    }
    return res.sendStatus(401)
  }

  authenticateToken(
    req,
    res,
    next,
    process.env.ACCESS_TOKEN_SECRET as string,
    'accessToken'
  )
}

export const authenticateRefreshToken: RequestHandler = (req, res, next) => {
  authenticateToken(
    req,
    res,
    next,
    process.env.REFRESH_TOKEN_SECRET as string,
    'refreshToken'
  )
}

const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction,
  key: string,
  tokenType: 'accessToken' | 'refreshToken'
) => {
  const { MODE } = process.env
  if (MODE?.trim() !== 'server') {
    req.user = {
      userId: 1234,
      clientId: 'desktopModeClientId',
      username: 'desktopModeUsername',
      displayName: 'desktopModeDisplayName',
      isAdmin: true,
      isActive: true
    }
    req.accessToken = 'desktopModeAccessToken'
    return next()
  }

  const authHeader = req.headers['authorization']
  const token = authHeader?.split(' ')[1]
  if (!token) return res.sendStatus(401)

  jwt.verify(token, key, async (err: any, data: any) => {
    if (err) return res.sendStatus(401)

    // verify this valid token's entry in DB
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
      } else return res.sendStatus(401)
    }
    return res.sendStatus(401)
  })
}
