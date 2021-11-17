import jwt from 'jsonwebtoken'
import { InfoJWT } from '../types'

export const generateAuthCode = (data: InfoJWT) =>
  jwt.sign(data, process.env.AUTH_CODE_SECRET as string, {
    expiresIn: '30s'
  })
