import express from 'express'
import { deleteFile, readFile } from '@sasjs/utils'
import { MemberType } from '@sasjs/utils'

import {
  ApiError,
  APP_MANIFEST,
  frontendFolderOf,
  isApiError
} from '@sasjs/api'

import {
  DEPLOY_NEEDS_FOLDER,
  namesNoDestination,
  prepareDeploy,
  publishDeployedApp,
  refuseTwoNames,
  sendDeploymentFile
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
  isArchiveName,
  isZipFile,
  renameBodyValidation,
  unpublishValidation
} from '../../utils'

const controller = new DriveController()

/**
 * Whether a tree carries the bundle's manifest at its root.
 *
 * A manifest that names neither an app nor a folder cannot make a destination -
 * `parseAppManifest` accepts one carrying only a logo - and the refusal has to say
 * which of the two it found. Telling someone the archive carries no manifest when
 * it carries one sends them to add a file that is already there.
 */
const carriesManifest = (tree: unknown): boolean =>
  Array.isArray((tree as any)?.members) &&
  (tree as any).members.some(
    (member: any) =>
      member?.name === APP_MANIFEST && member?.type === MemberType.file
  )

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

    const { error: archiveError, value: zipFile } = isZipFile(req.file)

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
    } else if (isArchiveName(req.file.originalname)) {
      // a file named .zip that the browser did not type as an archive: read as a
      // deploy document it is refused for "invalid JSON content", which names
      // neither the file nor what is wrong with it. Answered as the deploy routes'
      // envelope rather than a bare string, because the sentence carries a name the
      // caller chose - a string body is typed `text/html`, and a name is markup
      deleteFile(req.file.path)
      return res.status(400).send({ status: 'failure', message: archiveError })
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

      // the same refusal as an archive's, in the document's own terms: a
      // document that states no folder, and whose tree states no manifest, has
      // nowhere to write its files
      if (
        prepared.request === undefined &&
        prepared.appLoc === undefined &&
        body.appLoc === undefined
      ) {
        const named = carriesManifest(body.fileTree)

        throw new ApiError(
          400,
          namesNoDestination(
            `The deploy document "${req.file?.originalname ?? 'uploaded'}"`,
            named
              ? `it states no "appLoc", and the ${APP_MANIFEST} in its tree names no app and no folder.`
              : `it states no "appLoc", and the tree it carries has no ${APP_MANIFEST} at its root.`,
            named
              ? `State "appLoc" in the document, name the app in that manifest ("name", or "appLoc" for a folder), or publish the zip a sasjs build writes, which states the destination itself.`
              : `State "appLoc" in the document, add a ${APP_MANIFEST} naming the app to the root of its "fileTree", or publish the zip a sasjs build writes, which states the destination itself.`
          )
        )
      }

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
    // publishing an archive serves what was in the folder, so a folder compressed
    // by hand is unwrapped; a request that names an `appLoc` keeps the archive's
    // structure, which is what that route promises - see "The archive's structure
    // is kept under appLoc" in docs/pages/apps.md
    const fileTree = await extractFileTreeFromZip(zipFile, undefined, {
      unwrap: value.appLoc === undefined
    })

    const deploy = {
      name: value.name,
      appLoc: value.appLoc,
      fileTree,
      streamWebFolder: value.streamWebFolder,
      streamServiceName: value.streamServiceName,
      streamLogo: value.streamLogo
    }

    const prepared = prepareDeploy(deploy as any)

    // nothing in the archive or the request says where its files go. The
    // package's own sentence says the rule; this one says what the admin chose
    // and how to fix it, because an archive of a folder and a bundle missing its
    // manifest read identically from the deploy's side.
    if (
      prepared.request === undefined &&
      prepared.appLoc === undefined &&
      value.appLoc === undefined
    ) {
      // a manifest that names nothing is not the same as no manifest: say which
      // one was found, or the advice is to add a file that is already there
      const named = carriesManifest(fileTree)

      throw new ApiError(
        400,
        namesNoDestination(
          `The archive "${zipFile.originalname}"`,
          named
            ? `it carries a ${APP_MANIFEST} that names no app and no folder.`
            : `it carries no ${APP_MANIFEST} at its root, and the request states neither "name" nor "appLoc".`,
          named
            ? `Name the app in that manifest ("name", or "appLoc" for a folder), or add ?name=<app> to publish this archive as an app, or ?appLoc=/<folder> to deploy its files to a folder.`
            : `Publish the zip a sasjs build writes, which states the destination itself, or add ?name=<app> to publish this archive as an app, or ?appLoc=/<folder> to deploy its files to a folder.`
        )
      )
    }

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
  // one file, two names that answer differently: a request carrying both is
  // refused by the package's rule, whatever spelling reached this route
  if (refuseTwoNames(req, res)) return

  // A streamed deployment links every asset through `_FILE=<path>`, the
  // spelling SAS Viya's job execution route answers, so one build opens on
  // either host. The read is the same operation as `path=` - one file, the same
  // permission rule on the same route - and only its typing differs: a page or
  // a script has to arrive as itself, not as bytes.
  if (typeof req.query._FILE === 'string')
    return sendDeploymentFile(req, res, req.query._FILE)

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
