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

// registered before '/:sessionId/state' does not matter - express matches whole
// segments - but the more specific paths are kept together for a reader
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

sessionRouter.get('/:sessionId', async (req, res) => {
  const { error, value: params } = sessionIdValidation(req.params)
  if (error) return res.status(400).send(error.details[0].message)

  try {
    const response = await controller.sessionDetail(params.sessionId)

    res.status(200).send(response)
  } catch (err: any) {
    const statusCode = err.code

    delete err.code

    res.status(statusCode).send(err)
  }
})

sessionRouter.get('/:sessionId/log', async (req, res) => {
  const { error, value: params } = sessionIdValidation(req.params)
  if (error) return res.status(400).send(error.details[0].message)

  try {
    const response = await controller.sessionLog(params.sessionId)

    res.status(200).type('text/plain').send(response)
  } catch (err: any) {
    const statusCode = err.code

    delete err.code

    res.status(statusCode).send(err)
  }
})

sessionRouter.get('/:sessionId/output', async (req, res: any) => {
  const { error, value: params } = sessionIdValidation(req.params)
  if (error) return res.status(400).send(error.details[0].message)

  try {
    const response = await controller.sessionOutput(req, params.sessionId)

    // the program owns the content type, and the synchronous execute path
    // answers a Buffer with the session's own headers, so do the same here
    if (response instanceof Buffer) {
      res.writeHead(200, (req as any).sasHeaders)
      return res.end(response)
    }

    res.send(response)
  } catch (err: any) {
    const statusCode = err.code

    delete err.code

    res.status(statusCode).send(err)
  }
})

export default sessionRouter
