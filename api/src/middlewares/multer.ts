import path from 'path'
import { Request, Response } from 'express'
import multer, { FileFilterCallback, Options } from 'multer'
import { blockFileRegex, getUploadsFolder } from '../utils'

const fieldNameSize = 300

/**
 * The largest file the drive's CRUD routes accept.
 *
 * The deploy routes have their own ceiling (`DEPLOY_PAYLOAD_BYTES`), because a
 * deploy travels as JSON in which file contents are base64 - 4/3 of the bytes
 * the tree writes - and the cap that bounds it is stated in decoded bytes. The
 * two are deliberately separate: raising this one to make room for a deploy
 * would widen the largest file a caller can write OUTSIDE the deploy path,
 * where `DEPLOY_LIMITS.fileBytes` caps a member at 20 MB.
 */
export const UPLOAD_LIMIT_BYTES = 100 * 1024 * 1024

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

/**
 * The refusals an upload can earn before its bytes are read.
 *
 * Per limit rather than shared, so the message names the ceiling the route
 * actually enforces.
 */
const fileFilterFor =
  (fileSize: number): Options['fileFilter'] =>
  (req: Request, file: Express.Multer.File, callback: FileFilterCallback) => {
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

/** One multer instance per ceiling, built on first use. */
const instances = new Map<number, ReturnType<typeof multer>>()

/**
 * How a refusal is written to the caller.
 *
 * The drive API answers a plain-text message, and its clients read that text, so
 * plain text is the default. A host that answers an envelope - the emulated Viya
 * mount - passes its own writer, so the parser's refusal travels in the same
 * shape as every other answer that host gives.
 */
export type RefusalWriter = (
  res: Response,
  status: number,
  message: string
) => void

const plainText: RefusalWriter = (res, status, message) => {
  res.status(status).send(message)
}

const instanceFor = (fileSize: number) => {
  const existing = instances.get(fileSize)

  if (existing) return existing

  const instance = multer({
    storage,
    limits: { fieldNameSize, fileSize },
    fileFilter: fileFilterFor(fileSize)
  })

  instances.set(fileSize, instance)

  return instance
}

export const multerSingle = (
  fileName: string,
  arg: any,
  fileSize = UPLOAD_LIMIT_BYTES,
  writeRefusal: RefusalWriter = plainText
) => {
  const [req, res, next] = arg
  const upload = instanceFor(fileSize).single(fileName)

  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // A part past `limits.fileSize` is the same refusal the filter gives an
      // upload whose Content-Length says so - it is the caller's file that is too
      // large, not the server failing, so 500 was the wrong answer. Every other
      // MulterError keeps multer's own status.
      const status = err.code === 'LIMIT_FILE_SIZE' ? 400 : 500

      return writeRefusal(res, status, err.message)
    } else if (err) {
      return writeRefusal(res, 400, err.message)
    }
    // Everything went fine.
    next()
  })
}

export default instanceFor(UPLOAD_LIMIT_BYTES)
