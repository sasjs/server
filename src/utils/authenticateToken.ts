import jwt from 'jsonwebtoken'
import { verifyTokenInDB } from './verifyTokenInDB'

export const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization']
  const token = authHeader?.split(' ')[1]
  if (!token) return res.sendStatus(401)

  jwt.verify(
    token,
    process.env.ACCESS_TOKEN_SECRET as string,
    async (err: any, data: any) => {
      if (err) return res.sendStatus(403)

      // verify this valid token's entry in DB
      const user = await verifyTokenInDB(data?.username, data?.client_id, token)

      if (user) {
        req.user = user
        return next()
      }
      return res.sendStatus(403)
    }
  )
}
