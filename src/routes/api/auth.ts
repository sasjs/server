import express from 'express'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'

import Client from '../../model/Client'
import User from '../../model/User'
import { authorizeValidation, tokenValidation } from '../../utils'
import { InfoJWT } from '../../types'

const authRouter = express.Router()

const clients: { [key: string]: string } = {}
const clientIDs = new Set()
const authCodes: { [key: string]: string } = {}

// connect to DB
mongoose.connect(process.env.DB_CONNECT as string, async (err) => {
  if (err) throw err

  console.log('Connected to db!')

  const result = await Client.find()
  result.forEach((r) => {
    clients[r.clientid] = r.clientsecret
    clientIDs.add(r.clientid)
  })
})

const refreshTokens: string[] = []

authRouter.post('/authorize', async (req, res) => {
  const { error, value } = authorizeValidation(req.body)
  if (error) return res.status(400).send(error.details[0].message)

  const { username, password, client_id } = value

  // Authenticate User
  const user = await User.findOne({ username })
  if (!user) return res.status(400).send('Username is not found.')

  const validPass = await bcrypt.compare(password, user.password)
  if (!validPass) return res.status(400).send('Invalid password.')

  // Verify client ID
  if (!clientIDs.has(client_id)) {
    return res.sendStatus(403)
  }

  // generate authorization code against client_id
  const userInfo: InfoJWT = {
    client_id,
    username,
    isadmin: user.isadmin,
    isactive: user.isactive
  }
  authCodes[client_id] = generateAuthCode(userInfo)

  res.json({ code: authCodes[client_id] })
})

authRouter.post('/token', async (req, res) => {
  const { error, value } = tokenValidation(req.body)
  if (error) return res.status(400).send(error.details[0].message)

  const { client_id, client_secret, code } = value

  const userInfo = await verifyAuthCode(client_id, client_secret, code)
  if (userInfo) {
    const accessToken = generateAccessToken(userInfo)
    const refreshToken = jwt.sign(
      userInfo,
      process.env.REFRESH_TOKEN_SECRET as string
    )
    refreshTokens.push(refreshToken)

    delete authCodes[client_id]

    res.json({ accessToken: accessToken, refreshToken: refreshToken })
  } else {
    res.sendStatus(403)
  }
})

// authRouter.post('/refresh', (req, res) => {
//   const refreshToken = req.body.token
//   if (refreshToken == null) return res.sendStatus(401)
//   if (!refreshTokens.includes(refreshToken)) return res.sendStatus(403)
//   jwt.verify(
//     refreshToken,
//     process.env.REFRESH_TOKEN_SECRET as string,
//     (err: any, user: any) => {
//       if (err) return res.sendStatus(403)
//       const accessToken = generateAccessToken({ name: user.name })
//       res.json({ accessToken: accessToken })
//     }
//   )
// })

authRouter.delete('/logout', (req, res) => {
  const index = refreshTokens.findIndex(req.body.token)
  if (index > -1) refreshTokens.splice(index, 1)

  res.sendStatus(204)
})

const generateAccessToken = (data: InfoJWT) =>
  jwt.sign(data, process.env.ACCESS_TOKEN_SECRET as string, {
    expiresIn: '1day'
  })

const generateAuthCode = (data: InfoJWT) =>
  jwt.sign(data, process.env.AUTH_CODE_SECRET as string, {
    expiresIn: '30s'
  })

const verifyAuthCode = async (
  client_id: string,
  client_secret: string,
  code: string
): Promise<InfoJWT | undefined> => {
  return new Promise((resolve, reject) => {
    jwt.verify(code, process.env.AUTH_CODE_SECRET as string, (err, data) => {
      if (err) return resolve(undefined)

      const clientInfo: InfoJWT = {
        client_id: data?.client_id,
        username: data?.username,
        isadmin: data?.isadmin,
        isactive: data?.isactive
      }
      if (
        clientInfo.client_id === client_id &&
        clients[client_id] === client_secret &&
        authCodes[client_id] === code
      ) {
        return resolve(clientInfo)
      }
      return resolve(undefined)
    })
  })
}

export default authRouter
