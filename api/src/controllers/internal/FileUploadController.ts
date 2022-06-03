import path from 'path'
import { Request, RequestHandler } from 'express'
import multer from 'multer'
import { uuidv4, fileExists, readFile } from '@sasjs/utils'
import { getSASSessionController, getJSSessionController } from '.'
import { getFilesFolder } from '../../utils'

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
    if (process.runTimes.length === 0) {
      throw 'No runtime is specified in environment variables.'
    }

    const programPath = req.query._program as string

    for (const runTime of process.runTimes) {
      const codePath =
        path
          .join(getFilesFolder(), programPath)
          .replace(new RegExp('/', 'g'), path.sep) + runTime

      if (await fileExists(programPath)) {
        const program = await readFile(codePath)

        if (runTime === 'sas') {
          const sessionController = getSASSessionController()
          const session = await sessionController.getSession()
          // marking consumed true, so that it's not available
          // as readySession for any other request
          session.consumed = true

          req.sasjsSession = session
        } else if (runTime === 'js') {
          const sessionController = getJSSessionController()
          const session = await sessionController.getSession()
          req.sasjsSession = session
        } else {
          throw `${runTime} runtime is not implemented yet.`
        }
      }
    }

    next()
  }

  public getMulterUploadObject() {
    return this.upload
  }
}
