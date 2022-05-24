import express from 'express'

import { AuthController } from '../../controllers/'

import {
  authenticateAccessToken,
  authenticateRefreshToken
} from '../../middlewares'

import { authorizeValidation, tokenValidation } from '../../utils'
import { InfoJWT } from '../../types'

const authRouter = express.Router()
const controller = new AuthController()

authRouter.post('/token', async (req, res) => {
  const { error, value: body } = tokenValidation(req.body)
  if (error) return res.status(400).send(error.details[0].message)

  try {
    const response = await controller.token(body)

    res.send(response)
  } catch (err: any) {
    res.status(403).send(err.toString())
  }
})

authRouter.post('/refresh', authenticateRefreshToken, async (req, res) => {
  const userInfo: InfoJWT = {
    userId: req.user!.userId!,
    clientId: req.user!.clientId!
  }

  try {
    const response = await controller.refresh(userInfo)

    res.send(response)
  } catch (err: any) {
    res.status(403).send(err.toString())
  }
})

authRouter.delete('/logout', authenticateAccessToken, async (req, res) => {
  const userInfo: InfoJWT = {
    userId: req.user!.userId!,
    clientId: req.user!.clientId!
  }

  try {
    await controller.logout(userInfo)
  } catch (e) {}

  res.sendStatus(204)
})

export default authRouter
