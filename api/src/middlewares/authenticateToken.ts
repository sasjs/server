import jwt from 'jsonwebtoken'
import { verifyTokenInDB } from '../utils'

export const authenticateAccessToken = (req: any, res: any, next: any) => {
  authenticateToken(
    req,
    res,
    next,
    process.env.ACCESS_TOKEN_SECRET as string,
    'accessToken'
  )
}

export const authenticateRefreshToken = (req: any, res: any, next: any) => {
  authenticateToken(
    req,
    res,
    next,
    process.env.REFRESH_TOKEN_SECRET as string,
    'refreshToken'
  )
}

const authenticateToken = (
  req: any,
  res: any,
  next: any,
  key: string,
  tokenType: 'accessToken' | 'refreshToken' = 'accessToken'
) => {
  const { MODE } = process.env
  if (MODE === 'desktop') return next()

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
