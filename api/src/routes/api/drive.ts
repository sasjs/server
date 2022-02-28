import express from 'express'
import { deleteFile } from '@sasjs/utils'

import { multerSingle } from '../../middlewares/multer'
import { DriveController } from '../../controllers/'
import {
  getFileDriveValidation,
  updateFileDriveValidation,
  uploadFileBodyValidation,
  uploadFileParamValidation
} from '../../utils'

const controller = new DriveController()

const driveRouter = express.Router()

driveRouter.post('/deploy', async (req, res) => {
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

  try {
    const response = await controller.getFile(query.filePath)
    res.send(response)
  } catch (err: any) {
    const statusCode = err.code

    delete err.code

    res.status(statusCode).send(err)
  }
})

driveRouter.post(
  '/file',
  (...arg) => multerSingle('file', arg),
  async (req, res) => {
    const { error: errQ, value: query } = uploadFileParamValidation(req.query)
    const { error: errB, value: body } = uploadFileBodyValidation(req.body)

    if (errQ && errB) {
      if (req.file) await deleteFile(req.file.path)
      return res.status(400).send(errB.details[0].message)
    }

    if (!req.file) return res.status(400).send('"file" is not present.')

    try {
      const response = await controller.saveFile(
        req.file,
        query._filePath,
        body.filePath
      )
      res.send(response)
    } catch (err: any) {
      await deleteFile(req.file.path)
      res.status(403).send(err.toString())
    }
  }
)

driveRouter.patch('/file', async (req, res) => {
  const { error, value: body } = updateFileDriveValidation(req.body)
  if (error) return res.status(400).send(error.details[0].message)

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
  try {
    const response = await controller.getFileTree()
    res.send(response)
  } catch (err: any) {
    res.status(403).send(err.toString())
  }
})

export default driveRouter
