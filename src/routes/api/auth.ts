import express from 'express'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'

import Client from '../../model/Client'
import User from '../../model/User'

import {
  authenticateAccessToken,
  authenticateRefreshToken
} from '../../middlewares'

import {
  authorizeValidation,
  removeTokensInDB,
  saveTokensInDB,
  tokenValidation
} from '../../utils'
import { InfoJWT } from '../../types'

const authRouter = express.Router()

const clientIDs = new Set()
const authCodes: { [key: string]: { [key: string]: string } } = {}

export const populateClients = async () => {
  const result = await Client.find()
  clientIDs.clear()
  result.forEach((r) => {
    clientIDs.add(r.clientId)
  })
}

export const connectDB = () => {
  // NOTE: when exporting app.js as agent for supertest
  // we should exlcude connecting to the real database
  if (process.env.NODE_ENV !== 'test') {
    mongoose.connect(process.env.DB_CONNECT as string, async (err) => {
      if (err) throw err

      console.log('Connected to db!')

      await populateClients()
    })
  }
}

export const saveCode = (userId: number, clientId: string, code: string) => {
  if (authCodes[userId]) return (authCodes[userId][clientId] = code)

  authCodes[userId] = { [clientId]: code }
  return authCodes[userId][clientId]
}
export const deleteCode = (userId: number, clientId: string) =>
  delete authCodes[userId][clientId]

authRouter.post('/authorize', async (req, res) => {
  const { error, value } = authorizeValidation(req.body)
  if (error) return res.status(400).send(error.details[0].message)

  const { username, password, clientId } = value

  // Verify client ID
  if (!clientIDs.has(clientId)) {
    return res.status(403).send('Invalid clientId.')
  }

  // Authenticate User
  const user = await User.findOne({ username })
  if (!user) return res.status(403).send('Username is not found.')

  const validPass = await bcrypt.compare(password, user.password)
  if (!validPass) return res.status(403).send('Invalid password.')

  // generate authorization code against clientId
  const userInfo: InfoJWT = {
    clientId,
    userId: user.id
  }

  const code = saveCode(user.id, clientId, generateAuthCode(userInfo))

  res.json({ code })
})

authRouter.post('/token', async (req, res) => {
  const { error, value } = tokenValidation(req.body)
  if (error) return res.status(400).send(error.details[0].message)

  const { clientId, code } = value

  const userInfo = await verifyAuthCode(clientId, code)
  if (!userInfo) return res.sendStatus(403)

  if (authCodes[userInfo.userId][clientId] !== code) return res.sendStatus(403)

  deleteCode(userInfo.userId, clientId)

  const accessToken = generateAccessToken(userInfo)
  const refreshToken = jwt.sign(
    userInfo,
    process.env.REFRESH_TOKEN_SECRET as string
  )

  await saveTokensInDB(userInfo.userId, clientId, accessToken, refreshToken)

  res.json({ accessToken: accessToken, refreshToken: refreshToken })
})

authRouter.post('/refresh', authenticateRefreshToken, async (req: any, res) => {
  const { userId, clientId } = req.user
  const userInfo = {
    userId,
    clientId
  }

  const accessToken = generateAccessToken(userInfo)
  const refreshToken = jwt.sign(
    userInfo,
    process.env.REFRESH_TOKEN_SECRET as string
  )

  await saveTokensInDB(userInfo.userId, clientId, accessToken, refreshToken)

  res.json({ accessToken: accessToken, refreshToken: refreshToken })
})

authRouter.delete('/logout', authenticateAccessToken, async (req: any, res) => {
  const { user } = req

  await removeTokensInDB(user.username, user.clientId)

  res.sendStatus(204)
})

export const generateAccessToken = (data: InfoJWT) =>
  jwt.sign(data, process.env.ACCESS_TOKEN_SECRET as string, {
    expiresIn: '1h'
  })

export const generateRefreshToken = (data: InfoJWT) =>
  jwt.sign(data, process.env.REFRESH_TOKEN_SECRET as string, {
    expiresIn: '1day'
  })

export const generateAuthCode = (data: InfoJWT) =>
  jwt.sign(data, process.env.AUTH_CODE_SECRET as string, {
    expiresIn: '30s'
  })

const verifyAuthCode = async (
  clientId: string,
  code: string
): Promise<InfoJWT | undefined> => {
  return new Promise((resolve, reject) => {
    jwt.verify(code, process.env.AUTH_CODE_SECRET as string, (err, data) => {
      if (err) return resolve(undefined)

      const clientInfo: InfoJWT = {
        clientId: data?.clientId,
        userId: data?.userId
      }
      if (clientInfo.clientId === clientId) {
        return resolve(clientInfo)
      }
      return resolve(undefined)
    })
  })
}

export default authRouter
