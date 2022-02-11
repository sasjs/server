import jwt from 'jsonwebtoken'
import { InfoJWT } from '../types'

export const generateAccessToken = (data: InfoJWT) =>
  jwt.sign(data, process.env.ACCESS_TOKEN_SECRET as string, {
    expiresIn: '1day'
  })
