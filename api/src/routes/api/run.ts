import express from 'express'
import { runSASValidation } from '../../utils'
import { RUNController } from '../../controllers/'

const runRouter = express.Router()

const controller = new RUNController()

runRouter.post('/code', async (req, res) => {
  const { error, value: body } = runSASValidation(req.body)
  if (error) return res.status(400).send(error.details[0].message)

  try {
    const response = await controller.runSAS(req, body)
    res.send(response)
  } catch (err: any) {
    const statusCode = err.code

    delete err.code

    res.status(statusCode).send(err)
  }
})

export default runRouter
