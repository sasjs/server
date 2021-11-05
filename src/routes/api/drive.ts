import express from 'express'
import DriveController from '../../controllers/drive'

const driveRouter = express.Router()

driveRouter.post('/deploy', async (req, res) => {
  const controller = new DriveController()
  try {
    const response = await controller.deploy(req.body)
    res.send(response)
  } catch (err: any) {
    const statusCode = err.code
    delete err.code
    res.status(statusCode).send(err)
  }
})

export default driveRouter
