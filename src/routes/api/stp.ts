import express from 'express'
import { ExecutionResult, isRequestQuery, isFileTree } from '../../types'
import path from 'path'
import { getTmpFilesFolderPath, makeFilesNamesMap } from '../../utils'
import { ExecutionController, FileUploadController } from '../../controllers'

const stpRouter = express.Router()

const fileUploadController = new FileUploadController()

stpRouter.post(
  '/execute',
  fileUploadController.preuploadMiddleware,
  fileUploadController.getMulterUploadObject().any(),
  async (req: any, res: any) => {
    if (isRequestQuery(req.body)) {
      let sasCodePath =
        path
          .join(getTmpFilesFolderPath(), req.body._program)
          .replace(new RegExp('/', 'g'), path.sep) + '.sas'

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

export default stpRouter
