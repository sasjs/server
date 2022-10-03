import express from 'express'
import { AuthConfigController } from '../../controllers'
const authConfigRouter = express.Router()

authConfigRouter.get('/', async (req, res) => {
  const controller = new AuthConfigController()
  try {
    const response = controller.getDetail()
    res.send(response)
  } catch (err: any) {
    res.status(500).send(err.toString())
  }
})

authConfigRouter.post('/synchroniseWithLDAP', async (req, res) => {
  const controller = new AuthConfigController()
  try {
    const response = await controller.synchroniseWithLDAP()
    res.send(response)
  } catch (err: any) {
    res.status(500).send(err.toString())
  }
})

export default authConfigRouter
