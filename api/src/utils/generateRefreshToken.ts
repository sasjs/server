import jwt from 'jsonwebtoken'
import { InfoJWT } from '../types'

export const generateRefreshToken = (data: InfoJWT) =>
  jwt.sign(data, process.secrets.REFRESH_TOKEN_SECRET, {
    expiresIn: '30 days'
  })
