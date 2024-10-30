import { Request, RequestHandler } from 'express'
import multer from 'multer'
import { uuidv4 } from '@sasjs/utils'
import { getSessionController } from '.'
import { executeProgramRawValidation, getRunTimeAndFilePath } from '../../utils'
import { SessionState } from '../../types'

export class FileUploadController {
  private storage = multer.diskStorage({
    destination: function (req: Request, file: any, cb: any) {
      //Sending the intercepted files to the sessions subfolder
      cb(null, req.sasjsSession?.path)
    },
    filename: function (req: Request, file: any, cb: any) {
      //req_file prefix + unique hash added to sas request files
      cb(null, `req_file_${uuidv4().replace(/-/gm, '')}`)
    }
  })

  private upload = multer({ storage: this.storage })

  //It will intercept request and generate unique uuid to be used as a subfolder name
  //that will store the files uploaded
  public preUploadMiddleware: RequestHandler = async (req, res, next) => {
    const { error: errQ, value: query } = executeProgramRawValidation(req.query)
    const { error: errB, value: body } = executeProgramRawValidation(req.body)

    if (errQ && errB) return res.status(400).send(errB.details[0].message)

    const programPath = (query?._program ?? body?._program) as string

    let runTime

    try {
      ;({ runTime } = await getRunTimeAndFilePath(programPath))
    } catch (err: any) {
      return res.status(400).send({
        status: 'failure',
        message: 'Job execution failed',
        error: typeof err === 'object' ? err.toString() : err
      })
    }

    let sessionController
    try {
      sessionController = getSessionController(runTime)
    } catch (err: any) {
      return res.status(400).send({
        status: 'failure',
        message: err.message,
        error: typeof err === 'object' ? err.toString() : err
      })
    }

    const session = await sessionController.getSession()
    // change session state to 'running', so that it's not available for any other request
    session.state = SessionState.running

    req.sasjsSession = session

    next()
  }

  public getMulterUploadObject() {
    return this.upload
  }
}
