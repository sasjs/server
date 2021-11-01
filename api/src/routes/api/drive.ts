import express from 'express'
import path from 'path'
import { createFileTree, getTreeExample, DriveController, ExecutionController } from '../../controllers'
import { isFileTree, isFileQuery } from '../../types'
import { getTmpFilesFolderPath } from '../../utils'

const driveRouter = express.Router()

driveRouter.post('/deploy', async (req, res) => {
  if (!isFileTree(req.body.fileTree)) {
    res.status(400).send({
      status: 'failure',
      message: 'Provided not supported data format.',
      example: getTreeExample()
    })

    return
  }

  await createFileTree(
    req.body.fileTree.members,
    req.body.appLoc ? req.body.appLoc.replace(/^\//, '').split('/') : []
  )
    .then(() => {
      res.status(200).send({
        status: 'success',
        message: 'Files deployed successfully to @sasjs/server.'
      })
    })
    .catch((err) => {
      res
        .status(500)
        .send({ status: 'failure', message: 'Deployment failed!', ...err })
    })
})

driveRouter.get('/files', async (req, res) => {
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

driveRouter.patch('/files', async (req, res) => {
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
