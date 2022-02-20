import express from 'express'
import { runSASValidation } from '../../utils'
import { CodeController } from '../../controllers/'

const runRouter = express.Router()

const controller = new CodeController()

runRouter.post('/execute', async (req, res) => {
  const { error, value: body } = runSASValidation(req.body)
  if (error) return res.status(400).send(error.details[0].message)

  try {
    const response = await controller.executeSASCode(req, body)

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

export default runRouter
