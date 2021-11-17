import jwt from 'jsonwebtoken'
import { InfoJWT } from '../types'

export const generateRefreshToken = (data: InfoJWT) =>
  jwt.sign(data, process.env.REFRESH_TOKEN_SECRET as string, {
    expiresIn: '1day'
  })
