import express from 'express'
import path from 'path'
import {
  DriveController,
  ExecutionController
} from '../../controllers'
import { isFileQuery } from '../../types'
import { getTmpFilesFolderPath } from '../../utils'

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
  if (isFileQuery(req.query)) {
    const filePath = path
      .join(getTmpFilesFolderPath(), req.query.filePath)
      .replace(new RegExp('/', 'g'), path.sep)
    await new DriveController()
      .readFile(filePath)
      .then((fileContent) => {
        res.status(200).send({ status: 'success', fileContent: fileContent })
      })
      .catch((err) => {
        res.status(400).send({
          status: 'failure',
          message: 'File request failed.',
          ...(typeof err === 'object' ? err : { details: err })
        })
      })
  } else {
    res.status(400).send({
      status: 'failure',
      message: 'Invalid Request: Expected parameter filePath was not provided'
    })
  }
})

driveRouter.patch('/file', async (req, res) => {
  const filePath = path
    .join(getTmpFilesFolderPath(), req.body.filePath)
    .replace(new RegExp('/', 'g'), path.sep)
  await new DriveController()
    .updateFile(filePath, req.body.fileContent)
    .then(() => {
      res.status(200).send({ status: 'success' })
    })
    .catch((err) => {
      res.status(400).send({
        status: 'failure',
        message: 'File request failed.',
        ...(typeof err === 'object' ? err : { details: err })
      })
    })
})

driveRouter.get('/fileTree', async (req, res) => {
  const tree = new ExecutionController().buildDirectorytree()
  res.status(200).send({ status: 'success', tree })
})

export default driveRouter
