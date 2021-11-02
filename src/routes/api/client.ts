import express from 'express'
import { createClient } from '../../controllers/createClient'
import { registerClientValidation } from '../../utils'

const clientRouter = express.Router()

clientRouter.post('/', async (req, res) => {
  const { error, value: data } = registerClientValidation(req.body)
  if (error) return res.status(400).send(error.details[0].message)

  try {
    const savedClient = await createClient(data)
    res.send({
      client_id: savedClient.client_id,
      client_secret: savedClient.client_secret
    })
  } catch (err: any) {
    res.status(403).send(err.toString())
  }
})

export default clientRouter
