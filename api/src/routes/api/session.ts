import express from 'express'
import { SessionController } from '../../controllers'
import { sessionIdValidation } from '../../utils'

const sessionRouter = express.Router()

const controller = new SessionController()

sessionRouter.get('/', async (req, res) => {
  try {
    const response = await controller.session(req)

    res.send(response)
  } catch (err: any) {
    res.status(403).send(err.toString())
  }
})

sessionRouter.get('/:sessionId/state', async (req, res) => {
  const { error, value: params } = sessionIdValidation(req.params)
  if (error) return res.status(400).send(error.details[0].message)

  try {
    const response = await controller.sessionState(params.sessionId)

    res.status(200)
    res.send(response)
  } catch (err: any) {
    const statusCode = err.code

    delete err.code

    res.status(statusCode).send(err)
  }
})

export default sessionRouter
