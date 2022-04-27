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

authRouter.post('/authorize', async (req, res) => {
  const { error, value: body } = authorizeValidation(req.body)
  if (error) return res.status(400).send(error.details[0].message)

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

  try {
    const response = await controller.token(body)
    const { accessToken } = response

    res.cookie('accessToken', accessToken).send(response)
  } catch (err: any) {
    res.status(403).send(err.toString())
  }
})

authRouter.post('/refresh', authenticateRefreshToken, async (req: any, res) => {
  const userInfo: InfoJWT = req.user

  try {
    const response = await controller.refresh(userInfo)

    res.send(response)
  } catch (err: any) {
    res.status(403).send(err.toString())
  }
})

authRouter.delete('/logout', authenticateAccessToken, async (req: any, res) => {
  const userInfo: InfoJWT = req.user

  try {
    await controller.logout(userInfo)
  } catch (e) {}

  res.sendStatus(204)
})

export default authRouter
