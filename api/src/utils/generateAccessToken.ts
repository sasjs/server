import jwt from 'jsonwebtoken'
import { InfoJWT } from '../types'

export const generateAccessToken = (data: InfoJWT, expiry?: number) =>
  jwt.sign(data, process.secrets.ACCESS_TOKEN_SECRET, {
    expiresIn: expiry ? `${expiry}d` : '1d'
  })
