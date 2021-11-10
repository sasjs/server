import express from 'express'
import { isExecutionQuery, PreProgramVars } from '../../types'
import path from 'path'
import { getTmpFilesFolderPath, makeFilesNamesMap } from '../../utils'
import { ExecutionController, FileUploadController } from '../../controllers'

const stpRouter = express.Router()

const fileUploadController = new FileUploadController()

stpRouter.get('/execute', async (req, res) => {
  if (isExecutionQuery(req.query)) {
    let sasCodePath =
      path
        .join(getTmpFilesFolderPath(), req.query._program)
        .replace(new RegExp('/', 'g'), path.sep) + '.sas'

    await new ExecutionController()
      .execute(sasCodePath, getPreProgramVariables(req), undefined, undefined, {
        ...req.query
      })
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

stpRouter.post(
  '/execute',
  fileUploadController.preuploadMiddleware,
  fileUploadController.getMulterUploadObject().any(),
  async (req: any, res: any) => {
    let _program
    if (isExecutionQuery(req.query)) {
      _program = req.query._program
    } else if (isExecutionQuery(req.body)) {
      _program = req.body._program
    }

    if (_program) {
      let sasCodePath =
        path
          .join(getTmpFilesFolderPath(), _program)
          .replace(new RegExp('/', 'g'), path.sep) + '.sas'

      let filesNamesMap = null

      if (req.files && req.files.length > 0) {
        filesNamesMap = makeFilesNamesMap(req.files)
      }

      await new ExecutionController()
        .execute(
          sasCodePath,
          getPreProgramVariables(req),
          undefined,
          req.sasSession,
          { ...req.query, ...req.body },
          { filesNamesMap: filesNamesMap },
          true
        )
        .then((result: {}) => {
          res.status(200).send({
            status: 'success',
            ...result
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

const getPreProgramVariables = (req: any): PreProgramVars => {
  const host = req.get('host')
  const protocol = req.protocol + '://'
  const { user, accessToken } = req
  return {
    username: user.username,
    userId: user.userId,
    displayName: user.displayName,
    serverUrl: protocol + host,
    accessToken
  }
}

export default stpRouter
