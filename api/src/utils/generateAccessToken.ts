import jwt from 'jsonwebtoken'
import { InfoJWT } from '../types'

export const generateAccessToken = (data: InfoJWT) =>
  jwt.sign(data, process.secrets.ACCESS_TOKEN_SECRET, {
    expiresIn: '1day'
  })
