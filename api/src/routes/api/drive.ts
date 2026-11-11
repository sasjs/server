import express from 'express'
import { deleteFile, readFile } from '@sasjs/utils'
import type { FileTree, FolderMember } from '@sasjs/utils'

import { isApiError } from '@sasjs/api'

import { prepareDeploy, publishDeployedApp } from '../../utils'

import { DEPLOY_PAYLOAD_BYTES } from '@sasjs/api'
import { multerSingle } from '../../middlewares/multer'
import { sendRefusal } from '../refusal'
import { DriveController } from '../../controllers/'
import {
  deployAssetsValidation,
  deployValidation,
  extractDeployDocumentFromZip,
  extractFileTreeFromZip,
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

/**
 * Renders the package's refusal the way every deploy route renders one: a
 * status, and the `{status, message}` envelope these two routes answer with.
 *
 * `prepareDeploy` is the package's decision about the app a bundle publishes -
 * a folder it cannot index, a web folder that is not one segment, a manifest
 * that is not JSON - and it runs before the drive is written, so its refusal is
 * a `400` naming the field rather than a deployment that half happened.
 */
const sendPublishRefusal = (res: express.Response, err: unknown): boolean => {
  if (!isApiError(err)) return false

  res.status(err.status).send(
    (err.body as object) ?? {
      status: 'failure',
      message: err.message
    }
  )

  return true
}

/**
 * Renders a refusal from the archive reader the way the deploy routes render a
 * tree's: a status from `code`, and the deploy routes' `{status, message}`
 * envelope.
 *
 * An `Error` is not JSON - `res.send(error)` answers `{}` - so a refusal thrown
 * by the reader would otherwise reach the client as an empty 413, or as the
 * express error handler's generic 500 when it is thrown outside a route's own
 * try. Anything that is not an Error keeps the shape it arrived with, which is
 * what `@sasjs/api`'s refusals use.
 */
const sendArchiveRefusal = (res: express.Response, err: any) => {
  const statusCode = typeof err.code === 'number' ? err.code : 500

  if (err instanceof Error)
    return res
      .status(statusCode)
      .send({ status: 'failure', message: err.message })

  delete err.code

  return res.status(statusCode).send(err)
}

driveRouter.post('/deploy', async (req, res) => {
  const { error, value: body } = deployValidation(req.body)
  if (error) return res.status(400).send(error.details[0].message)

  try {
    // every reason to refuse the app is decided before the drive is written
    const { tree, request } = prepareDeploy(body)

    const response = await controller.deploy({ ...body, fileTree: tree as any })

    await publishDeployedApp(response as any, request)

    res.send(response)
  } catch (err: any) {
    if (sendPublishRefusal(res, err)) return

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
      try {
        fileContent = (await extractDeployDocumentFromZip(zipFile)) ?? ''
      } catch (err: any) {
        // the reader refuses an oversized document before parsing it, and that
        // refusal is the deploy cap's 413, not a broken request
        deleteFile(req.file.path)
        return sendArchiveRefusal(res, err)
      }

      // An archive with no deploy document in it is the app's own files: the
      // entries become the tree and what the document would have said (folder,
      // stream, replace) arrives in the query.
      if (!fileContent) return deployArchive(req, res, zipFile)
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
      // the document is an archive's deploy request, so it publishes exactly as
      // the JSON route does - one implementation of when a bundle is an app
      const { tree, request } = prepareDeploy(body)

      const response = await controller.deploy({
        ...body,
        fileTree: tree as any
      })

      await publishDeployedApp(response as any, request)

      res.send(response)
    } catch (err: any) {
      if (!sendPublishRefusal(res, err)) {
        const statusCode = err.code

        delete err.code

        res.status(statusCode).send(err)
      }
    } finally {
      deleteFile(req.file.path)
    }
  }
)

/**
 * Deploys an archive of an app's own files.
 *
 * `POST /SASjsApi/drive/deploy/upload` takes either a deploy document - plain or
 * zipped - or, as here, the app itself: a zip whose entries are the files to
 * serve. The entries become a deploy tree and go through the same deploy as any
 * other, so the cap, the member-name checks, containment and `replace` have one
 * implementation.
 *
 * What a deploy document would have said arrives in the QUERY, because the body
 * is the archive: `appLoc` is required, `streamWebFolder` publishes the folder
 * as an App Stream app, and `replace` defaults to true - publishing a folder
 * means the folder is what the archive says it is.
 */
const deployArchive = async (
  req: express.Request,
  res: express.Response,
  zipFile: Express.Multer.File
) => {
  const { error, value } = deployAssetsValidation(req.query)

  if (error) {
    deleteFile(zipFile.path)

    return res.status(400).send(error.details[0].message)
  }

  try {
    const fileTree = await extractFileTreeFromZip(zipFile)

    const deploy = {
      appLoc: value.appLoc,
      fileTree,
      streamWebFolder: value.streamWebFolder,
      streamServiceName: value.streamServiceName,
      streamLogo: value.streamLogo
    }

    const { tree, request } = prepareDeploy(deploy as any)

    const response = await controller.deploy({
      appLoc: value.appLoc,
      fileTree: tree as any,
      replace: value.replace
    })

    await publishDeployedApp(response as any, request)

    res.send(response)
  } catch (err: any) {
    if (!sendPublishRefusal(res, err)) sendArchiveRefusal(res, err)
  } finally {
    deleteFile(zipFile.path)
  }
}

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

// The document, the shared route table in `@sasjs/api` and the mock all spell
// this `filetree`; the route inventory below spells it `fileTree`, and keeps
// doing so - a permission record names a route, and the records already written
// carry that spelling. Express matches case-insensitively and the gate resolves
// the request against the inventory, so both spellings are answered and granted
// either way; this is the spelling the contract states.
driveRouter.get('/filetree', async (req, res) => {
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
