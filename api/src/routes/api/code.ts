import express from 'express'
import { runCodeValidation } from '../../utils'
import { CodeController } from '../../controllers/'
import { authorize } from '../../middlewares'

const runRouter = express.Router()

const controller = new CodeController()

runRouter.post('/execute', authorize, async (req, res) => {
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

export default runRouter
