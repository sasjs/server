import express from 'express'
import { deleteFile, readFile } from '@sasjs/utils'

import { publishAppStream } from '../appStream'

import { DEPLOY_PAYLOAD_BYTES } from '@sasjs/api'
import { multerSingle } from '../../middlewares/multer'
import { sendRefusal } from '../refusal'
import { DriveController } from '../../controllers/'
import {
  deployValidation,
  extractJSONFromZip,
  extractName,
  fileBodyValidation,
  fileParamValidation,
  fileTreeParamValidation,
  folderBodyValidation,
  folderParamValidation,
  HttpError,
  isZipFile,
  renameBodyValidation,
  unpublishValidation
} from '../../utils'

const controller = new DriveController()

const driveRouter = express.Router()

driveRouter.post('/deploy', async (req, res) => {
  const { error, value: body } = deployValidation(req.body)
  if (error) return res.status(400).send(error.details[0].message)

  try {
    const response = await controller.deploy(body)

    if (body.streamWebFolder) {
      const { streamServiceName } = await publishAppStream(
        body.appLoc,
        body.streamWebFolder,
        body.streamServiceName,
        body.streamLogo
      )
      response.streamServiceName = streamServiceName
    }

    res.send(response)
  } catch (err: any) {
    const statusCode = err.code

    delete err.code

    res.status(statusCode).send(err)
  }
})

driveRouter.post(
  '/deploy/upload',
  // The deploy ceiling, not the drive's: an archive or a JSON file carrying a
  // tree at DEPLOY_LIMITS.totalBytes is up to ~134MB (base64 is 4/3), so the
  // transport admits the largest encoding the cap allows and the cap is what
  // refuses. The CRUD routes keep the smaller default.
  (...arg) => multerSingle('file', arg, DEPLOY_PAYLOAD_BYTES),
  async (req, res) => {
    if (!req.file) return res.status(400).send('"file" is not present.')

    let fileContent: string = ''

    const { value: zipFile } = isZipFile(req.file)
    if (zipFile) {
      fileContent = await extractJSONFromZip(zipFile)
      const fileInZip = extractName(zipFile.originalname)

      if (!fileContent) {
        deleteFile(req.file.path)
        return res
          .status(400)
          .send(
            `No content present in ${fileInZip} of compressed file ${zipFile.originalname}`
          )
      }
    } else {
      fileContent = await readFile(req.file.path)
    }

    let jsonContent
    try {
      jsonContent = JSON.parse(fileContent)
    } catch (err) {
      deleteFile(req.file.path)
      return res.status(400).send('File containing invalid JSON content.')
    }

    const { error, value: body } = deployValidation(jsonContent)
    if (error) {
      deleteFile(req.file.path)
      return res.status(400).send(error.details[0].message)
    }

    try {
      const response = await controller.deployUpload(req.file, body)

      if (body.streamWebFolder) {
        const { streamServiceName } = await publishAppStream(
          body.appLoc,
          body.streamWebFolder,
          body.streamServiceName,
          body.streamLogo
        )
        response.streamServiceName = streamServiceName
      }

      res.send(response)
    } catch (err: any) {
      const statusCode = err.code

      delete err.code

      res.status(statusCode).send(err)
    } finally {
      deleteFile(req.file.path)
    }
  }
)

/**
 * Removes a published app stream entry, so it stops being advertised and stops
 * being served. Both fields are required: `appLoc` is what tells a name that has
 * been republished elsewhere from the entry the caller means to remove. The drive
 * content is untouched - that is `DELETE /SASjsApi/drive/folder` - so this route
 * cannot destroy a deployment. The permission gate is the one already on
 * `/SASjsApi/drive/deploy` for publishing: rules are per path, not per method.
 */
driveRouter.delete('/deploy', async (req, res) => {
  const { error, value: body } = unpublishValidation(req.body || {})

  if (error) return res.status(400).send(error.details[0].message)

  try {
    // the controller owns the removal, the way every other drive route delegates
    // its work: one implementation, so the documented operation and the answered
    // one cannot drift, and the status it refuses with is decided in one place
    res.send(await controller.unpublish(body))
  } catch (err: any) {
    sendRefusal(res, err)
  }
})

driveRouter.get('/file', async (req, res) => {
  const { error: errQ, value: query } = fileParamValidation(req.query)

  if (errQ) return res.status(400).send(errQ.details[0].message)

  try {
    await controller.getFile(req, query._filePath)
  } catch (err: any) {
    const statusCode = err.code

    delete err.code

    res.status(statusCode).send(err.message)
  }
})

driveRouter.get('/folder', async (req, res) => {
  const { error: errQ, value: query } = folderParamValidation(req.query)

  if (errQ) return res.status(400).send(errQ.details[0].message)

  try {
    const response = await controller.getFolder(query._folderPath)
    res.send(response)
  } catch (err: any) {
    const statusCode = err.code

    delete err.code

    res.status(statusCode).send(err.message)
  }
})

driveRouter.delete('/file', async (req, res) => {
  const { error: errQ, value: query } = fileParamValidation(req.query)

  if (errQ) return res.status(400).send(errQ.details[0].message)

  try {
    const response = await controller.deleteFile(query._filePath)
    res.send(response)
  } catch (err: any) {
    const statusCode = err.code

    delete err.code

    res.status(statusCode).send(err.message)
  }
})

driveRouter.delete('/folder', async (req, res) => {
  const { error: errQ, value: query } = folderParamValidation(req.query, true)

  if (errQ) return res.status(400).send(errQ.details[0].message)

  try {
    const response = await controller.deleteFolder(query._folderPath)
    res.send(response)
  } catch (err: any) {
    const statusCode = err.code

    delete err.code

    res.status(statusCode).send(err.message)
  }
})

driveRouter.post(
  '/file',
  (...arg) => multerSingle('file', arg),
  async (req, res) => {
    const { error: errQ, value: query } = fileParamValidation(req.query)
    const { error: errB, value: body } = fileBodyValidation(req.body)

    if (errQ && errB) {
      if (req.file) await deleteFile(req.file.path)
      return res.status(400).send(errQ.details[0].message)
    }

    if (!req.file) return res.status(400).send('"file" is not present.')

    try {
      const response = await controller.saveFile(
        req.file,
        query._filePath,
        body.filePath
      )
      res.send(response)
    } catch (err: any) {
      await deleteFile(req.file.path)

      const statusCode = err.code

      delete err.code

      res.status(statusCode).send(err.message)
    }
  }
)

driveRouter.post('/folder', async (req, res) => {
  const { error, value: body } = folderBodyValidation(req.body)

  if (error) return res.status(400).send(error.details[0].message)

  try {
    const response = await controller.addFolder(body)
    res.send(response)
  } catch (err: any) {
    const statusCode = err.code

    delete err.code

    res.status(statusCode).send(err.message)
  }
})

driveRouter.patch(
  '/file',
  (...arg) => multerSingle('file', arg),
  async (req, res) => {
    const { error: errQ, value: query } = fileParamValidation(req.query)
    const { error: errB, value: body } = fileBodyValidation(req.body)

    if (errQ && errB) {
      if (req.file) await deleteFile(req.file.path)
      return res.status(400).send(errQ.details[0].message)
    }

    if (!req.file) return res.status(400).send('"file" is not present.')

    try {
      const response = await controller.updateFile(
        req.file,
        query._filePath,
        body.filePath
      )
      res.send(response)
    } catch (err: any) {
      await deleteFile(req.file.path)

      const statusCode = err.code

      delete err.code

      res.status(statusCode).send(err.message)
    }
  }
)

driveRouter.post('/rename', async (req, res) => {
  const { error, value: body } = renameBodyValidation(req.body)

  if (error) return res.status(400).send(error.details[0].message)

  try {
    const response = await controller.rename(body)
    res.send(response)
  } catch (err: any) {
    const statusCode = err.code

    delete err.code

    res.status(statusCode).send(err.message)
  }
})

driveRouter.get('/fileTree', async (req, res) => {
  const { error, value: query } = fileTreeParamValidation(req.query)

  if (error) return res.status(400).send(error.details[0].message)

  try {
    const response = await controller.getFileTree(query._folderPath)
    res.send(response)
  } catch (err: any) {
    // buildDirectoryLevel reports the reason it refused a folder (outside the
    // drive, missing, not a folder) by throwing an HttpError; anything else
    // stays a blanket 403. Reading the status off the class keeps Node fs errors
    // - whose `code` is a string such as 'ENOENT' and is not a valid HTTP
    // status - from ever reaching res.status().
    const statusCode = err instanceof HttpError ? err.status : 403
    const message = err?.message ?? err?.toString()

    // text/plain, not the text/html `send(string)` defaults to: the message
    // names the caller's own path, and this API backs an authenticated admin
    // UI, so it must not be rendered as a document.
    res.status(statusCode).type('text/plain').send(message)
  }
})

export default driveRouter
