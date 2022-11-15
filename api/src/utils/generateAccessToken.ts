import jwt from 'jsonwebtoken'
import { InfoJWT } from '../types'
import { NUMBER_OF_SECONDS_IN_A_DAY } from '../model/Client'

export const generateAccessToken = (data: InfoJWT, expiry?: number) =>
  jwt.sign(data, process.secrets.ACCESS_TOKEN_SECRET, {
    expiresIn: expiry ? expiry : NUMBER_OF_SECONDS_IN_A_DAY
  })
