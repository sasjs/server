import path from 'path'
import { Request } from 'express'
import multer, { FileFilterCallback, Options } from 'multer'
import { blockFileRegex, getUploadsFolder } from '../utils'

const fieldNameSize = 300
// 140MB, not 100: the deploy cap is stated in DECODED bytes, and an uploaded
// tree arrives either as plain JSON (up to ~134MB for a tree at the cap, base64
// being 4/3) or as a zip of it. The transport admits the largest encoding the
// cap allows, so the cap is what refuses. See DEPLOY_LIMITS in
// utils/deployLimits.ts.
const fileSize = 140 * 1024 * 1024

const storage = multer.diskStorage({
  destination: getUploadsFolder(),
  filename: function (
    _req: Request,
    file: Express.Multer.File,
    callback: (error: Error | null, filename: string) => void
  ) {
    callback(
      null,
      file.fieldname + path.extname(file.originalname) + '-' + Date.now()
    )
  }
})

const limits: Options['limits'] = {
  fieldNameSize,
  fileSize
}

const fileFilter: Options['fileFilter'] = (
  req: Request,
  file: Express.Multer.File,
  callback: FileFilterCallback
) => {
  const shouldBlockUpload = blockFileRegex.test(file.originalname)
  if (shouldBlockUpload) {
    // The drive's one extension refusal, in the wording every drive route
    // uses: the path rule in @sasjs/api answers 'Invalid file extension', and
    // an upload whose own name carries the extension is the same refusal.
    return callback(new Error('Invalid file extension'))
  }

  const uploadFileSize = parseInt(req.headers['content-length'] ?? '')
  if (uploadFileSize > fileSize) {
    return callback(
      new Error(
        `File size is over limit. File limit is: ${fileSize / 1024 / 1024} MB`
      )
    )
  }

  callback(null, true)
}

const options: Options = { storage, limits, fileFilter }

const multerInstance = multer(options)

export const multerSingle = (fileName: string, arg: any) => {
  const [req, res, next] = arg
  const upload = multerInstance.single(fileName)

  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(500).send(err.message)
    } else if (err) {
      return res.status(400).send(err.message)
    }
    // Everything went fine.
    next()
  })
}

export default multerInstance
