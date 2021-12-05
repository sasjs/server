import express from 'express'
import { SessionController } from '../../controllers'
import { authenticateAccessToken } from '../../middlewares'

const sessionRouter = express.Router()

sessionRouter.get('/', async (req, res) => {
  const controller = new SessionController()
  try {
    const response = await controller.session(req)
    res.send(response)
  } catch (err: any) {
    res.status(403).send(err.toString())
  }
})

export default sessionRouter
