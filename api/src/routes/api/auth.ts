import express from 'express'

import { AuthController } from '../../controllers/'
import Client from '../../model/Client'

import {
  authenticateAccessToken,
  authenticateRefreshToken
} from '../../middlewares'

import {
  authorizeValidation,
  getDesktopFields,
  tokenValidation
} from '../../utils'
import { InfoJWT } from '../../types'

const authRouter = express.Router()

const clientIDs = new Set()

export const populateClients = async () => {
  const result = await Client.find()
  clientIDs.clear()
  result.forEach((r) => {
    clientIDs.add(r.clientId)
  })
}

authRouter.post('/authorize', async (req, res) => {
  const { error, value: body } = authorizeValidation(req.body)
  if (error) return res.status(400).send(error.details[0].message)

  const { clientId } = body

  // Verify client ID
  if (!clientIDs.has(clientId)) {
    return res.status(403).send('Invalid clientId.')
  }

  const controller = new AuthController()
  try {
    const response = await controller.authorize(body)

    res.send(response)
  } catch (err: any) {
    res.status(403).send(err.toString())
  }
})

authRouter.post('/token', async (req, res) => {
  const { error, value: body } = tokenValidation(req.body)
  if (error) return res.status(400).send(error.details[0].message)

  const controller = new AuthController()
  try {
    const response = await controller.token(body)

    res.send(response)
  } catch (err: any) {
    res.status(403).send(err.toString())
  }
})

authRouter.post('/refresh', authenticateRefreshToken, async (req: any, res) => {
  const userInfo: InfoJWT = req.user

  const controller = new AuthController()
  try {
    const response = await controller.refresh(userInfo)

    res.send(response)
  } catch (err: any) {
    res.status(403).send(err.toString())
  }
})

authRouter.delete('/logout', authenticateAccessToken, async (req: any, res) => {
  const userInfo: InfoJWT = req.user

  const controller = new AuthController()
  try {
    await controller.logout(userInfo)
  } catch (e) {}

  res.sendStatus(204)
})

export default authRouter
