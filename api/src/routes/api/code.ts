import express from 'express'
import {
  formatCodeValidation,
  lintCodeValidation,
  runCodeValidation,
  triggerCodeValidation
} from '../../utils'
import { CodeController } from '../../controllers/'

const runRouter = express.Router()

const controller = new CodeController()

runRouter.post('/execute', async (req, res) => {
  const { error, value: body } = runCodeValidation(req.body)
  if (error) return res.status(400).send(error.details[0].message)

  try {
    const response = await controller.executeCode(req, body)

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

runRouter.post('/trigger', async (req, res) => {
  const { error, value: body } = triggerCodeValidation(req.body)
  if (error) return res.status(400).send(error.details[0].message)

  try {
    const response = await controller.triggerCode(req, body)

    res.status(200)
    res.send(response)
  } catch (err: any) {
    const statusCode = err.code

    delete err.code

    res.status(statusCode).send(err)
  }
})

runRouter.post('/lint', async (req, res) => {
  const { error, value: body } = lintCodeValidation(req.body)
  if (error) return res.status(400).send(error.details[0].message)

  try {
    const response = await controller.lintCode(body)
    res.send(response)
  } catch (err: any) {
    const statusCode = err.code

    delete err.code

    res.status(statusCode).send(err)
  }
})

runRouter.post('/format', async (req, res) => {
  const { error, value: body } = formatCodeValidation(req.body)
  if (error) return res.status(400).send(error.details[0].message)

  try {
    const response = await controller.formatCode(body)

    // The response is the formatted code as a JSON string: `send` would
    // serve it as text/html, which is neither the content type the
    // swagger spec declares nor one a JSON client parses.
    res.json(response)
  } catch (err: any) {
    const statusCode = err.code

    delete err.code

    res.status(statusCode).send(err)
  }
})

export default runRouter
