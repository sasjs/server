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

    // multer has not run yet, so a multipart body is empty here - but a JSON body
    // was parsed before the router (app.ts installs express.json ahead of it), and
    // `_program` in that body is a documented way to call this route.
    //
    // The body value goes through the same schema as the query, so the same
    // request resolves to the same path wherever `_program` was sent: a bare
    // typeof check would accept a number, an array or an object that the schema
    // refuses, and skip anything the schema does to the value.
    const { error: errB, value: bodyVars } = executeProgramRawValidation({
      _program: (req.body as { _program?: unknown } | undefined)?._program
    })
    const bodyProgram = errB ? undefined : bodyVars._program

    // Only a query whose ONLY failure is the missing `_program` is excused by the
    // body carrying it: any other query error - a malformed `_debug`, say - still
    // refuses the request, otherwise the body would silently paper over it
    if (errQ) {
      const soleMissingProgram = errQ.details.every((detail) =>
        detail.path.includes('_program')
      )

      if (!soleMissingProgram || !bodyProgram)
        return res.status(400).send(errQ.details[0].message)
    }

    // `||`, not `??`: an empty query value is absent in every sense that matters,
    // and must not shadow a program the body does carry
    const programPath = (query?._program || bodyProgram) as string

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
