import express from 'express'
import { InfoController } from '../../controllers'

const infoRouter = express.Router()

infoRouter.get('/', async (req, res) => {
  const controller = new InfoController()
  try {
    const response = controller.info()
    res.send(response)
  } catch (err: any) {
    res.status(403).send(err.toString())
  }
})

infoRouter.get('/authorizedRoutes', async (req, res) => {
  const controller = new InfoController()
  try {
    const response = controller.authorizedRoutes()
    res.send(response)
  } catch (err: any) {
    res.status(403).send(err.toString())
  }
})

export default infoRouter
