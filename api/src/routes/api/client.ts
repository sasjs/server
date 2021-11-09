import express from 'express'
import ClientController from '../../controllers/client'
import { registerClientValidation } from '../../utils'

const clientRouter = express.Router()

clientRouter.post('/', async (req, res) => {
  const { error, value: body } = registerClientValidation(req.body)
  if (error) return res.status(400).send(error.details[0].message)

  const controller = new ClientController()
  try {
    const response = await controller.createClient(body)
    res.send(response)
  } catch (err: any) {
    res.status(403).send(err.toString())
  }
})

export default clientRouter
