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
 * A refusal, with the status the route answers it with.
 *
 * `code` is the reason in the vocabulary multer uses for its own limits, so a
 * host can tell a ceiling from an extension rule without matching on prose - the
 * emulated mount answers the two ceilings 413 and the rest 400.
 */
export interface UploadRefusal {
  status: number
  message: string
  code: string
}

/** A refusal this parser made, attached to the error the filter throws. */
const refusal = (status: number, message: string, code: string): Error =>
  Object.assign(new Error(message), {
    uploadRefusal: { status, message, code }
  })

const refusalOf = (error: unknown): UploadRefusal | undefined =>
  (error as { uploadRefusal?: UploadRefusal } | null)?.uploadRefusal

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
      return callback(
        refusal(400, 'Invalid file extension', 'INVALID_EXTENSION')
      )
    }

    const uploadFileSize = parseInt(req.headers['content-length'] ?? '')
    if (uploadFileSize > fileSize) {
      return callback(
        refusal(
          400,
          `File size is over limit. File limit is: ${fileSize / 1024 / 1024} MB`,
          'LIMIT_FILE_SIZE'
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
export type RefusalWriter = (res: Response, refusal: UploadRefusal) => void

const plainText: RefusalWriter = (res, { status, message }) => {
  res.status(status).send(message)
}

/**
 * What a route may tell the parser: the ceiling it enforces and how a refusal is
 * written.
 *
 * An object rather than positional arguments, so a call site cannot slide the
 * writer into the size slot by leaving the size out.
 */
export interface UploadOptions {
  fileSize?: number
  writeRefusal?: RefusalWriter
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
  // a bare number is the ceiling, which is how the drive routes state theirs
  options: UploadOptions | number = {}
) => {
  const { fileSize = UPLOAD_LIMIT_BYTES, writeRefusal = plainText } =
    typeof options === 'number' ? { fileSize: options } : options
  const [req, res, next] = arg
  const upload = instanceFor(fileSize).single(fileName)

  upload(req, res, function (err) {
    if (!err) return next()

    // The filter's own refusals carry the status they are answered with.
    const parserRefusal = refusalOf(err)

    if (parserRefusal) return writeRefusal(res, parserRefusal)

    // Multer's errors describe the caller's request as well - an unexpected
    // field, a part or file count, a field size - and multer gives them no
    // status of its own, so they are refused as caller errors.
    if (err instanceof multer.MulterError)
      return writeRefusal(res, {
        status: 400,
        message: err.message,
        code: err.code
      })

    // Anything else is the server's: a full disk, a destination it cannot write
    // to. The message can carry an absolute path, so it is logged rather than
    // sent to the caller.
    process.logger?.error?.(err)

    return writeRefusal(res, {
      status: 500,
      message: 'The file could not be stored.',
      code: 'STORAGE_FAILURE'
    })
  })
}

export default instanceFor(UPLOAD_LIMIT_BYTES)
