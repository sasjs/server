import express from 'express'
import { isExecutionQuery } from '../../types'
import path from 'path'
import {
  getTmpFilesFolderPath,
  getWebBuildFolderPath,
} from '../../utils'
import { ExecutionController } from '../../controllers'

const webRouter = express.Router()

webRouter.get('/', async (_, res) => {
  res.sendFile(path.join(getWebBuildFolderPath(), 'index.html'))
})

webRouter.get('/SASjsExecutor/do', async (req, res) => {
  if (isExecutionQuery(req.query)) {
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
