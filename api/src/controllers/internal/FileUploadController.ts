import { Request, RequestHandler } from 'express'
import multer from 'multer'
import { uuidv4 } from '@sasjs/utils'
import { getSessionController } from '.'
import {
  executeProgramRawValidation,
  getRunTimeAndFilePath,
  RunTimeType
} from '../../utils'
import { SessionState } from '../../types'
import {
  viyaWebJobRequest,
  viyaWebDefinition
} from '../../utils/tierPostVariables'
import { persistedDefinition } from '../../routes/viya/persistedDefinition'
import { resolveDrivePath } from './nodeDriveStore'
import { hasRoutePermission } from '../../middlewares/authorize'
import { registry } from '../../routes/viya/localJes'

// The same parser Multer's type-is uses; a failed parse makes Multer silently
// skip the upload instead of reporting an error.
const contentType: {
  parse: (value: string) => { type: string; parameters: Record<string, string> }
} = require('content-type')

export class FileUploadController {
  private storage = multer.diskStorage({
    destination: function (req: Request, _file: any, cb: any) {
      //Sending the intercepted files to the sessions subfolder
      cb(null, req.sasjsSession?.path)
    },
    filename: function (_req: Request, _file: any, cb: any) {
      //req_file prefix + unique hash added to sas request files
      cb(null, `req_file_${uuidv4().replace(/-/gm, '')}`)
    }
  })

  private upload = multer({ storage: this.storage })

  //It will intercept request and generate unique uuid to be used as a subfolder name
  //that will store the files uploaded
  public preUploadMiddleware: RequestHandler = async (req, res, next) => {
    const type = req.headers['content-type'] ?? ''
    if (/^\s*multipart\//i.test(type)) {
      try {
        const parsed = contentType.parse(type)
        if (
          parsed.type !== 'multipart/form-data' ||
          !parsed.parameters.boundary
        )
          throw new Error('Invalid multipart boundary')
      } catch {
        return res.status(400).send('Invalid multipart upload.')
      }
    }

    const registered = (req as any)[viyaWebDefinition] as
      { selector?: string; job: string; target?: string } | undefined
    if (registered) {
      try {
        const url = req.url
        const baseUrl = req.baseUrl
        let allowed: boolean
        try {
          req.url = '/SASjsApi/stp/execute'
          req.baseUrl = ''
          allowed = await hasRoutePermission(req)
        } finally {
          req.url = url
          req.baseUrl = baseUrl
        }
        if (!allowed) return res.sendStatus(401)
        const matches: { selector: string; target: string }[] = []
        // Resolve the job URI independently of ordinary request variables.
        for (const [selector, target] of Object.entries(registry())) {
          const definition = await persistedDefinition(req, selector)
          const synthetic = Buffer.from(selector).toString('base64url')
          if (
            registered.job ===
            `/jobDefinitions/definitions/${definition?.id ?? synthetic}`
          )
            matches.push({ selector, target })
        }
        if (matches.length !== 1)
          return res.status(400).send('Unregistered local JS job.')
        Object.assign(registered, matches[0])
        const params = new URLSearchParams(req.url.split('?')[1] ?? '')
        params.set('_program', matches[0].target)
        req.url = `/execute?${params.toString()}`
      } catch {
        return res.status(401).send('Definition access denied.')
      }
    }

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
      if (registered?.target) resolveDrivePath(registered.target)
      ;({ runTime } = await getRunTimeAndFilePath(programPath))
      if ((req as any)[viyaWebJobRequest] && runTime !== RunTimeType.JS)
        return res
          .status(400)
          .send('Only local JS programs are supported by this mock.')
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

    const session = await sessionController.getSession(req.user!.username)
    // change session state to 'running', so that it's not available for any other request
    session.state = SessionState.running

    req.sasjsSession = session

    if ((req as any)[viyaWebJobRequest]) {
      const abandon = () => {
        if (session.state === SessionState.running)
          session.state = SessionState.failed
      }
      if (req.aborted || (req.destroyed && !req.complete) || res.destroyed) {
        abandon()
        return
      }
      req.once('aborted', abandon)
    }

    next()
  }

  public getMulterUploadObject() {
    return this.upload
  }

  public uploadViya: RequestHandler = (req, res, next) => {
    const type = req.headers['content-type'] ?? ''
    if (
      /^multipart\/form-data\s*;/i.test(type) &&
      req.headers['content-length'] === '0' &&
      !req.headers['transfer-encoding']
    ) {
      // The whole header and its boundary were validated before allocation.
      req.body = Object.create(null)
      req.files = []
      return next()
    }
    this.upload.any()(req, res, (error: any) => {
      if (!error) return next()
      if (req.sasjsSession) req.sasjsSession.state = SessionState.failed
      return res.status(400).send('Invalid multipart upload.')
    })
  }
}
