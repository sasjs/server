import express from 'express'
import path from 'path'
import {
  createFileTree,
  getTreeExample,
  SASjsDriveController,
  ExecutionController,
  FileUploadController
} from '../controllers'
import { isExecutionQuery, isFileQuery, isFileTree } from '../types'
import {
  getTmpFilesFolderPath,
  getWebBuildFolderPath,
  makeFilesNamesMap
} from '../utils'

const router = express.Router()

const fileUploadController = new FileUploadController()

router.get('/', async (_, res) => {
  res.sendFile(path.join(getWebBuildFolderPath(), 'index.html'))
})

router.post('/deploy', async (req, res) => {
  if (!isFileTree({ members: req.body.members })) {
    res.status(400).send({
      status: 'failure',
      message: 'Provided not supported data format.',
      example: getTreeExample()
    })

    return
  }

  await createFileTree(
    req.body.members,
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

router.get('/SASjsApi/files', async (req, res) => {
  if (isFileQuery(req.query)) {
    const filePath = path
      .join(getTmpFilesFolderPath(), req.query.filePath)
      .replace(new RegExp('/', 'g'), path.sep)
    const fileContent = await new SASjsDriveController().readFile(filePath)
    res.status(200).send({ status: 'success', fileContent: fileContent })
  } else {
    res.status(400).send({
      status: 'failure',
      message: 'Invalid Request: Expected parameter filePath was not provided'
    })
  }
})

router.post('/SASjsApi/files', async (req, res) => {
  const filePath = path
    .join(getTmpFilesFolderPath(), req.body.filePath)
    .replace(new RegExp('/', 'g'), path.sep)
  await new SASjsDriveController().updateFile(filePath, req.body.fileContent)
  res.status(200).send({ status: 'success' })
})

router.get('/SASjsApi/executor', async (req, res) => {
  const tree = new ExecutionController().buildDirectorytree()
  res.status(200).send({ status: 'success', tree })
})

router.get('/SASjsExecutor/do', async (req, res) => {
  if (isExecutionQuery(req.query)) {
    let sasCodePath = path
      .join(getTmpFilesFolderPath(), req.query._program)
      .replace(new RegExp('/', 'g'), path.sep)

    // If no extension provided, add .sas extension
    sasCodePath += '.sas'

    await new ExecutionController()
      .execute(sasCodePath, undefined, undefined, { ...req.query })
      .then((result: {}) => {
        res.status(200).send(result)
      })
      .catch((err: {} | string) => {
        res.status(400).send({
          status: 'failure',
          message: 'Job execution failed.',
          ...(typeof err === 'object' ? err : { details: err })
        })
      })
  } else {
    res.status(400).send({
      status: 'failure',
      message: `Please provide the location of SAS code`
    })
  }
})

router.post(
  '/SASjsExecutor/do',
  fileUploadController.preuploadMiddleware,
  fileUploadController.getMulterUploadObject().any(),
  async (req: any, res: any) => {
    if (isExecutionQuery(req.query)) {
      let sasCodePath = path
        .join(getTmpFilesFolderPath(), req.query._program)
        .replace(new RegExp('/', 'g'), path.sep)

      // If no extension provided, add .sas extension
      sasCodePath += '.sas'

      let filesNamesMap = null

      if (req.files && req.files.length > 0) {
        filesNamesMap = makeFilesNamesMap(req.files)
      }

      await new ExecutionController()
        .execute(
          sasCodePath,
          undefined,
          req.sasSession,
          { ...req.query, ...req.body },
          { filesNamesMap: filesNamesMap }
        )
        .then((result: {}) => {
          res.status(200).send(result)
        })
        .catch((err: {} | string) => {
          res.status(400).send({
            status: 'failure',
            message: 'Job execution failed.',
            ...(typeof err === 'object' ? err : { details: err })
          })
        })
    } else {
      res.status(400).send({
        status: 'failure',
        message: `Please provide the location of SAS code`
      })
    }
  }
)

export default router
