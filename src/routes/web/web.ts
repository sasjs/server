import express from 'express'
import {
  createFileTree,
  getSessionController,
  getTreeExample
} from '../../controllers'
import { ExecutionResult, isRequestQuery, isFileTree } from '../../types'
import path from 'path'
import {
  getTmpFilesFolderPath,
  getTmpFolderPath,
  makeFilesNamesMap
} from '../../utils'
import { ExecutionController, FileUploadController } from '../../controllers'
import { uuidv4 } from '@sasjs/utils'

const webRouter = express.Router()

webRouter.get('/', async (_, res) => {
  res.status(200).send('Welcome to @sasjs/server API')
})

// TODO: respond with HTML page including file tree
webRouter.get('/SASjsExecutor', async (req, res) => {
  res.status(200).send({ status: 'success', tree: {} })
})

webRouter.get('/SASjsExecutor/do', async (req, res) => {
  if (isRequestQuery(req.query)) {
    let sasCodePath =
      path
        .join(getTmpFilesFolderPath(), req.query._program)
        .replace(new RegExp('/', 'g'), path.sep) + '.sas'

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

export default webRouter
