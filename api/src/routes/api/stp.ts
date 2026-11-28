import express from 'express'
import {
  executeProgramRawValidation,
  parseDebugValue,
  triggerProgramValidation,
  ModeType
} from '../../utils'
import { STPController } from '../../controllers/'
import { FileUploadController } from '../../controllers/internal'
import { viyaWebJobRequest } from '../../utils/tierPostVariables'
import { SessionState } from '../../types'
import { unlink } from 'fs/promises'

const discardViyaUpload = async (req: express.Request) => {
  if (req.sasjsSession?.state === SessionState.running)
    req.sasjsSession.state = SessionState.failed
  await Promise.all(
    ((req.files ?? []) as Express.Multer.File[]).map((file) =>
      unlink(file.path).catch((error: NodeJS.ErrnoException) => {
        if (error.code !== 'ENOENT')
          process.logger?.error('Failed to remove staged upload', error)
      })
    )
  )
}

const stpRouter = express.Router()

const fileUploadController = new FileUploadController()
const controller = new STPController()

stpRouter.get('/execute', async (req, res) => {
  const { error, value: query } = executeProgramRawValidation(req.query)
  if (error) return res.status(400).send(error.details[0].message)

  try {
    const response = await controller.executeGetRequest(
      req,
      query._program,
      parseDebugValue(query._debug)
    )

    if (response instanceof Buffer) {
      res.writeHead(200, (req as any).sasHeaders)
      return res.end(response)
    }

    res.send(response)
  } catch (err: any) {
    const statusCode = err.code

    delete err.code

    res.status(statusCode).send(err)
  }
})

stpRouter.post(
  '/execute',
  fileUploadController.preUploadMiddleware,
  (req, res, next) =>
    (req as any)[viyaWebJobRequest]
      ? fileUploadController.uploadViya(req, res, next)
      : fileUploadController.getMulterUploadObject().any()(req, res, next),
  async (req, res: any) => {
    if ((req as any)[viyaWebJobRequest]) {
      const fields = [
        ...Object.entries(req.body ?? {}),
        ...((req.files ?? []) as Express.Multer.File[]).map(
          (file) => [file.fieldname, null] as [string, unknown]
        )
      ]
      if (
        fields.some(
          ([name, value]) =>
            [
              '_program',
              '_file',
              '_job',
              '_executiontasks',
              '_form',
              '_prompts'
            ].includes(name.toLowerCase()) ||
            (name.toLowerCase() === '_debug' &&
              value !== '' &&
              value !== '0' &&
              (value !== '131' || process.env.MODE !== ModeType.Desktop)) ||
            (name.toLowerCase() === '_action' && value !== 'execute')
        )
      ) {
        await discardViyaUpload(req)
        return res.status(400).send('Unsupported Viya web-job request.')
      }
    }
    // below validations are moved to preUploadMiddleware
    // const { error: errQ, value: query } = executeProgramRawValidation(req.query)
    // const { error: errB, value: body } = executeProgramRawValidation(req.body)

    // if (errQ && errB) return res.status(400).send(errB.details[0].message)

    try {
      const response = await controller.executePostRequest(
        req,
        req.body,
        req.query?._program as string
      )

      // TODO: investigate if this code is required
      // if (response instanceof Buffer) {
      //   res.writeHead(200, (req as any).sasHeaders)
      //   return res.end(response)
      // }

      res.send(response)
    } catch (err: any) {
      if ((req as any)[viyaWebJobRequest]) await discardViyaUpload(req)
      const statusCode = err.code

      delete err.code

      res.status(statusCode).send(err)
    }
  }
)

stpRouter.post('/trigger', async (req, res) => {
  const { error, value: query } = triggerProgramValidation(req.query)

  if (error) return res.status(400).send(error.details[0].message)

  try {
    const response = await controller.triggerProgram(
      req,
      query._program,
      parseDebugValue(query._debug),
      query.expiresAfterMins
    )

    res.status(200)
    res.send(response)
  } catch (err: any) {
    const statusCode = err.code

    delete err.code

    res.status(statusCode).send(err)
  }
})

export default stpRouter
