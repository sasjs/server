import path from 'path'
import { Request } from 'express'
import multer, { FileFilterCallback, Options } from 'multer'
import { blockFileRegex, getTmpUploadsPath } from '../utils'

const fieldNameSize = 300
const fileSize = 104857600 // 100 MB

const storage = multer.diskStorage({
  destination: getTmpUploadsPath(),
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
  const fileExtension = path.extname(file.originalname)
  const shouldBlockUpload = blockFileRegex.test(file.originalname)
  if (shouldBlockUpload) {
    return callback(
      new Error(`File extension '${fileExtension}' not acceptable.`)
    )
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
