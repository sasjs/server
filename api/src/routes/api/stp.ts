import express from 'express'
import { executeProgramRawValidation } from '../../utils'
import { STPController } from '../../controllers/'
import { FileUploadController } from '../../controllers/internal'
import { authorize } from '../../middlewares'

const stpRouter = express.Router()

const fileUploadController = new FileUploadController()
const controller = new STPController()

stpRouter.get('/execute', authorize, async (req, res) => {
  const { error, value: query } = executeProgramRawValidation(req.query)
  if (error) return res.status(400).send(error.details[0].message)

  try {
    const response = await controller.executeReturnRaw(req, query._program)

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
  authorize,
  fileUploadController.preUploadMiddleware,
  fileUploadController.getMulterUploadObject().any(),
  async (req, res: any) => {
    // below validations are moved to preUploadMiddleware
    // const { error: errQ, value: query } = executeProgramRawValidation(req.query)
    // const { error: errB, value: body } = executeProgramRawValidation(req.body)

    // if (errQ && errB) return res.status(400).send(errB.details[0].message)

    try {
      const response = await controller.executeReturnJson(
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
      const statusCode = err.code

      delete err.code

      res.status(statusCode).send(err)
    }
  }
)

export default stpRouter
