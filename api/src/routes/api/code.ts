import express from 'express'
import { runCodeValidation, triggerCodeValidation } from '../../utils'
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

export default runRouter
