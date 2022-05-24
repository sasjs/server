import { Request, RequestHandler } from 'express'
import multer from 'multer'
import { uuidv4 } from '@sasjs/utils'
import { getSessionController } from '.'

export class FileUploadController {
  private storage = multer.diskStorage({
    destination: function (req: Request, file: any, cb: any) {
      //Sending the intercepted files to the sessions subfolder
      cb(null, req.sasSession?.path)
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
    let session

    const sessionController = getSessionController()
    session = await sessionController.getSession()
    // marking consumed true, so that it's not available
    // as readySession for any other request
    session.consumed = true

    req.sasSession = session

    next()
  }

  public getMulterUploadObject() {
    return this.upload
  }
}
