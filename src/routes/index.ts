import express from 'express'
import {
  createFileTree,
  getSessionController,
  getTreeExample
} from '../controllers'
import { ExecutionResult, isRequestQuery, isFileTree } from '../types'
import path from 'path'
import {
  getTmpFilesFolderPath,
  getTmpFolderPath,
  makeFilesNamesMap
} from '../utils'
import { ExecutionController, FileUploadController } from '../controllers'
import { uuidv4 } from '@sasjs/utils'

const router = express.Router()

const fileUploadController = new FileUploadController()

router.get('/', async (_, res) => {
  res.status(200).send('Welcome to @sasjs/server API')
})

router.post('/deploy', async (req, res) => {
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

// TODO: respond with HTML page including file tree
router.get('/SASjsExecutor', async (req, res) => {
  res.status(200).send({ status: 'success', tree: {} })
})

router.get('/SASjsExecutor/do', async (req, res) => {
  if (isRequestQuery(req.query)) {
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
  '/files/files/execute',
  fileUploadController.preuploadMiddleware,
  fileUploadController.getMulterUploadObject().any(),
  async (req: any, res: any) => {
    if (isRequestQuery(req.body)) {
      let sasCodePath = path
        .join(getTmpFilesFolderPath(), req.body._program)
        .replace(new RegExp('/', 'g'), path.sep)

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
          res.status(200).send({
            status: 'success',
            ...(typeof result === 'object' ? result : { result: result })
          })
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
