import express from 'express'
import { DriveController } from '../../controllers/'
import { getFileDriveValidation, updateFileDriveValidation } from '../../utils'

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

driveRouter.get('/file', async (req, res) => {
  const { error, value: query } = getFileDriveValidation(req.query)
  if (error) return res.status(400).send(error.details[0].message)

  const controller = new DriveController()
  try {
    const response = await controller.getFile(query.filePath)
    res.send(response)
  } catch (err: any) {
    const statusCode = err.code

    delete err.code

    res.status(statusCode).send(err)
  }
})

driveRouter.patch('/file', async (req, res) => {
  const { error, value: body } = updateFileDriveValidation(req.body)
  if (error) return res.status(400).send(error.details[0].message)

  const controller = new DriveController()
  try {
    const response = await controller.updateFile(body)
    res.send(response)
  } catch (err: any) {
    const statusCode = err.code

    delete err.code

    res.status(statusCode).send(err)
  }
})

driveRouter.get('/fileTree', async (req, res) => {
  const controller = new DriveController()
  try {
    const response = await controller.getFileTree()
    res.send(response)
  } catch (err: any) {
    res.status(403).send(err.toString())
  }
})

export default driveRouter
