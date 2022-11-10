import jwt from 'jsonwebtoken'
import { InfoJWT } from '../types'

export const generateRefreshToken = (data: InfoJWT, expiry?: number) =>
  jwt.sign(data, process.secrets.REFRESH_TOKEN_SECRET, {
    expiresIn: expiry ? `${expiry}d` : '30d'
  })
