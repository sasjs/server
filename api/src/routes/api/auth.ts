import express from 'express'

import { AuthController } from '../../controllers/'

import {
  authenticateAccessToken,
  authenticateRefreshToken
} from '../../middlewares'

import { tokenValidation, updatePasswordValidation } from '../../utils'
import { InfoJWT } from '../../types'
import { sendRefusal } from '../refusal'

const authRouter = express.Router()
const controller = new AuthController()

authRouter.patch(
  '/updatePassword',
  authenticateAccessToken,
  async (req, res) => {
    const { error, value: body } = updatePasswordValidation(req.body)
    if (error) return res.status(400).send(error.details[0].message)

    try {
      await controller.updatePassword(req, body)
      res.sendStatus(204)
    } catch (err: any) {
      sendRefusal(res, err)
    }
  }
)

authRouter.post('/token', async (req, res) => {
  const { error, value: body } = tokenValidation(req.body)
  if (error) return res.status(400).send(error.details[0].message)

  try {
    const response = await controller.token(body)

    res.send(response)
  } catch (err: any) {
    sendRefusal(res, err)
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
    sendRefusal(res, err)
  }
})

// The documented method: the operation is a POST in the OpenAPI document and in
// the controller it describes. The router is what tells a client what to call,
// so it is the router that follows the document.
authRouter.post('/logout', authenticateAccessToken, async (req, res) => {
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
