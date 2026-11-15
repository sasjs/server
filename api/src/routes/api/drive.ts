import express from 'express'
import { deleteFile, readFile } from '@sasjs/utils'
import type { FileTree, FolderMember } from '@sasjs/utils'

import { ApiError, frontendFolderOf, isApiError } from '@sasjs/api'

import {
  DEPLOY_NEEDS_FOLDER,
  prepareDeploy,
  publishDeployedApp
} from '../../utils'
import type { PreparedDeploy } from '../../utils'

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

/**
 * The writes a prepared deploy makes, in the order that keeps a bundle coherent.
 *
 * A package writes its backend first, so a frontend is never live against services
 * that are not deployed yet, then its frontend.
 *
 * Each half REPLACES the folder it lands in: the folder becomes what the bundle
 * says it holds, so a service the new bundle no longer carries stops being served
 * and a page it dropped stops being reachable. Several frontends may name one
 * backend - what an app is, is its frontend - but each deploy of that backend
 * rewrites it, so the last bundle to carry it is what the folder holds. Keeping a
 * folder two bundles both write to means deploying them in order, not merging
 * them.
 *
 * A bundle that carries only a backend deploys it and publishes nothing: there is
 * no frontend to serve, so there is no app to index.
 *
 * A bare tree that a publish names is the frontend itself, so it goes to
 * `apps/<name>` too. Everything else is the older shape, deployed to `appLoc`.
 *
 * Every refusal here happens before the first write, so a bundle that cannot be
 * deployed whole leaves the drive as it was.
 */
const writeDeploy = async (
  prepared: PreparedDeploy,
  options: { appLoc?: string; replace?: boolean }
) => {
  const { tree, frontend, backend, request } = prepared

  // the folder this deploy writes to, from one source: a legacy bundle may name
  // it in its manifest, where `publishRequestFor` found it, and the folder written
  // has to be the folder indexed. A bundle carrying only a backend has no checked
  // request, so its manifest is read directly - see `PreparedDeploy.appLoc`.
  const appLoc = request?.appLoc ?? options.appLoc ?? prepared.appLoc

  // a bundle that carries services has to say where they go: skipping the write
  // would answer `200` for a deployment whose backend is simply missing, which is
  // the one thing a caller cannot see from the response
  if (backend !== undefined && appLoc === undefined)
    throw new ApiError(
      400,
      'This bundle carries a "backend" folder but names no "appLoc" for it: state the backend folder in sasjs.app.json, or in the request.'
    )

  // the package requires a name of a frontend publish, so this is the type
  // saying what the code already knows - and a guard rather than `String()`,
  // which would write the frontend to a folder called "undefined"
  if (frontend !== undefined && request?.name === undefined)
    throw new ApiError(
      400,
      '"name" is required to publish the frontend this bundle carries.'
    )

  let backendResponse: unknown

  if (backend !== undefined)
    backendResponse = await controller.deploy({
      appLoc: appLoc as string,
      fileTree: backend as any,
      // replaces: the folder becomes what this bundle carries, so a service the
      // bundle dropped stops being served
      replace: true
    })

  if (frontend !== undefined)
    return controller.deploy({
      appLoc: frontendFolderOf(request!.name as string),
      fileTree: frontend as any,
      replace: true
    })

  // backend only: the deploy is the answer, and there is no app to index
  if (backend !== undefined) return backendResponse

  // neither half: the older shapes, which deploy one tree to the folder they name
  if (request !== undefined && request.streamWebFolder === undefined) {
    if (request.name === undefined)
      throw new ApiError(400, '"name" is required to publish this bundle.')

    return controller.deploy({
      appLoc: frontendFolderOf(request.name),
      fileTree: tree as any,
      replace: true
    })
  }

  // an ApiError rather than an HttpError, because both deploy routes render this
  // family of refusal through `sendPublishRefusal`: one wording whether the
  // refusal came from the package's checks or from this file's
  if (appLoc === undefined) throw new ApiError(400, DEPLOY_NEEDS_FOLDER)

  return controller.deploy({
    appLoc,
    fileTree: tree as any,
    replace: options.replace
  })
}

driveRouter.post('/deploy', async (req, res) => {
  const { error, value: body } = deployValidation(req.body)
  if (error) return res.status(400).send(error.details[0].message)

  try {
    // every reason to refuse the app is decided before the drive is written
    const prepared = prepareDeploy(body)

    const response = await writeDeploy(prepared, {
      appLoc: body.appLoc,
      replace: body.replace
    })

    await publishDeployedApp(response as any, prepared.request)

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
      const prepared = prepareDeploy(body)

      const response = await writeDeploy(prepared, {
        appLoc: body.appLoc,
        replace: body.replace
      })

      await publishDeployedApp(response as any, prepared.request)

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
 * is the archive. `name` publishes the entries as the app of that name, which is
 * how a bare folder of compiled web assets becomes `apps/<name>` without a
 * manifest; `appLoc` deploys to a folder, `streamWebFolder` publishes the older
 * shape, and `replace` defaults to true - publishing a folder means the folder is
 * what the archive says it is.
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
      name: value.name,
      appLoc: value.appLoc,
      fileTree,
      streamWebFolder: value.streamWebFolder,
      streamServiceName: value.streamServiceName,
      streamLogo: value.streamLogo
    }

    const prepared = prepareDeploy(deploy as any)

    const response = await writeDeploy(prepared, {
      appLoc: value.appLoc,
      replace: value.replace
    })

    await publishDeployedApp(response as any, prepared.request)

    res.send(response)
  } catch (err: any) {
    if (!sendPublishRefusal(res, err)) sendArchiveRefusal(res, err)
  } finally {
    deleteFile(zipFile.path)
  }
}

/**
 * Removes a published app, so it stops being advertised and stops being served.
 * The id is the handle: a name may be shared and a folder is where an app was
 * published rather than what it is.
 *
 * An app published as a frontend is its folder, so `apps/<name>` is removed with
 * it - see `unpublishApp`. A deployment published the older way keeps its files,
 * because they sit inside a folder that may serve other apps. The permission gate
 * is the one already on `/SASjsApi/drive/deploy` for publishing: rules are per
 * path, not per method.
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
