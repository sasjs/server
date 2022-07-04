import jwt from 'jsonwebtoken'
import { InfoJWT } from '../types'

export const generateAuthCode = (data: InfoJWT) =>
  jwt.sign(data, process.secrets.AUTH_CODE_SECRET, {
    expiresIn: '30s'
  })
