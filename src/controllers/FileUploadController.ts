import { uuidv4 } from '@sasjs/utils'
import { getSessionController } from '.'
const multer = require('multer')

export class FileUploadController {
  private storage = multer.diskStorage({
    destination: function (req: any, file: any, cb: any) {
      //Sending the intercepted files to the sessions subfolder
      cb(null, req.sasSession.path)
    },
    filename: function (req: any, file: any, cb: any) {
      //req_file prefix + unique hash added to sas request files
      cb(null, `req_file_${uuidv4().replace(/-/gm, '')}`)
    }
  })

  private upload = multer({ storage: this.storage })

  //It will intercept request and generate uniqe uuid to be used as a subfolder name
  //that will store the files uploaded
  public preuploadMiddleware = async (req: any, res: any, next: any) => {
    let session

    const sessionController = getSessionController()
    session = await sessionController.getSession()
    session.inUse = true

    req.sasSession = session

    next()
  }

  public getMulterUploadObject() {
    return this.upload
  }
}
