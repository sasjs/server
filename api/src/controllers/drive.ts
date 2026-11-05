import path from 'path'
import fs from 'fs'
import express, { Express } from 'express'
import {
  Security,
  Request,
  Route,
  Tags,
  Example,
  Post,
  Body,
  Response,
  SuccessResponse,
  Query,
  Get,
  Patch,
  UploadedFile,
  FormField,
  Delete,
  Hidden
} from 'tsoa'
import { deleteFile, FileTree, isFileTree } from '@sasjs/utils'
import {
  createDriveService,
  hasBlockedExtension,
  isApiError,
  isRoot,
  normaliseDrivePath
} from '@sasjs/api'
import { createFileTree, ExecutionController, getTreeExample } from './internal'
import { nodeDriveStore, resolveDrivePath } from './internal/nodeDriveStore'

import { TreeNode } from '../types'
import { resolveWithinDrive } from '../utils'

interface DeployPayload {
  appLoc: string
  streamWebFolder?: string
  fileTree: FileTree
}

interface DeployResponse {
  status: string
  message: string
  streamServiceName?: string
  example?: FileTree
}

interface GetFileResponse {
  status: string
  fileContent?: string
  message?: string
}

interface GetFileTreeResponse {
  status: string
  tree: TreeNode
}

interface FileFolderResponse {
  status: string
  message?: string
}

interface AddFolderPayload {
  /**
   * Location of folder
   * @example "/Public/someFolder"
   */
  folderPath: string
}

interface RenamePayload {
  /**
   * Old path of file/folder
   * @example "/Public/someFolder"
   */
  oldPath: string
  /**
   * New path of file/folder
   * @example "/Public/newFolder"
   */
  newPath: string
}

const fileTreeExample = getTreeExample()

const successDeployResponse: DeployResponse = {
  status: 'success',
  message: 'Files deployed successfully to @sasjs/server.'
}

const invalidDeployFormatResponse: DeployResponse = {
  status: 'failure',
  message: 'Provided not supported data format.',
  example: fileTreeExample
}

const execDeployErrorResponse: DeployResponse = {
  status: 'failure',
  message: 'Deployment failed!'
}

/**
 * The drive's rules, from the package both hosts share.
 *
 * The statuses, the messages, the order of the checks and the path rules -
 * including the blocked extensions and a rename that would move a folder into
 * itself - are @sasjs/api's, exercised by the conformance corpus both this
 * server and the browser build run. The store is node's fs behind the drive
 * root. The routes catch the package's ApiError and render it the way every
 * drive route renders a refusal.
 *
 * Built on first use rather than at import time: the controller sits in the
 * module cycle through the internal barrel, and an import order that
 * evaluates this file before the store has finished would capture an
 * unresolved binding.
 */
const driveService = (() => {
  let service: ReturnType<typeof createDriveService>
  return () => (service ??= createDriveService(nodeDriveStore()))
})()

/**
 * The package's refusals carry `status`; the routes' catch reads `code`. This
 * turns one into the other with the status WORD the code means - the same
 * words every other refusal in this file carries - and keeps the message,
 * which is what a client reads. The original error is preserved as the
 * cause, so a log that walks it keeps the package's stack.
 */
const statusWord = (code: number): string =>
  code === 400
    ? 'Bad Request'
    : code === 404
      ? 'Not Found'
      : code === 409
        ? 'Conflict'
        : 'Error'

const answer = async <T>(call: Promise<T>): Promise<T> => {
  try {
    return await call
  } catch (error) {
    if (isApiError(error)) {
      const refusal: any = new Error(error.message)
      refusal.code = error.status
      refusal.status = statusWord(error.status)
      refusal.cause = error
      throw refusal
    }
    throw error
  }
}

@Route('SASjsApi/drive')
@Tags('Drive')
@Security('bearerAuth')
export class DriveController {
  /**
   * Creates or updates files within SASjs Drive from a JSON file tree.
   *
   * `appLoc` is the folder within the drive to deploy into, and `fileTree` is a
   * nested description of the folders, services and files to write. `appLoc`
   * cannot point outside the drive. A `400` is returned for a payload that is
   * not a valid file tree, and a `500` when writing fails.
   *
   * @summary Deploy a file tree to SASjs Drive
   */
  @Example<DeployResponse>(successDeployResponse)
  @Response<DeployResponse>(400, 'Invalid Format', invalidDeployFormatResponse)
  @Response<DeployResponse>(500, 'Execution Error', execDeployErrorResponse)
  @Post('/deploy')
  public async deploy(@Body() body: DeployPayload): Promise<DeployResponse> {
    return deploy(body)
  }

  /**
   * Creates or updates files within SASjs Drive from an uploaded JSON file.
   *
   * The file may be plain JSON or a zip holding a single JSON file of the same
   * name (for example `deploy.json.zip` for `deploy.json`); any other member of
   * the archive is ignored. The payload has the same shape as
   * `POST /SASjsApi/drive/deploy`.
   *
   * @summary Deploy an uploaded file to SASjs Drive
   */
  @Example<DeployResponse>(successDeployResponse)
  @Response<DeployResponse>(400, 'Invalid Format', invalidDeployFormatResponse)
  @Response<DeployResponse>(500, 'Execution Error', execDeployErrorResponse)
  @Post('/deploy/upload')
  public async deployUpload(
    @UploadedFile() file: Express.Multer.File, // passing here for API docs
    @Query() @Hidden() body?: DeployPayload // Hidden decorator has be optional
  ): Promise<DeployResponse> {
    return deploy(body!)
  }

  /**
   * Returns the content of a file within SASjs Drive.
   *
   * A `400` is returned for a path outside the drive and a `404` when the file
   * does not exist. A `.sas` file is served as `text/plain`.
   *
   * @summary Get a file from SASjs Drive
   * @param _filePath Location of the file within the drive
   * @example _filePath "/Public/somefolder/some.file"
   */
  @SuccessResponse('200', 'The contents of the file')
  @Response(400, `Can't get file outside drive`)
  @Response(404, `File doesn't exist`)
  @Get('/file')
  public async getFile(
    @Request() request: express.Request,
    @Query() _filePath: string
  ) {
    // The package's own path rules decide, the same composition its service
    // applies to every file operation: a path whose normalisation leaves the
    // drive, or whose name carries a blocked extension, is refused here with
    // the wording the conformance corpus pins. The rules run without reading
    // a byte, so the transport can stream the file rather than hold it.
    const drivePath = normaliseDrivePath(_filePath)
    if (drivePath === null || isRoot(drivePath))
      throw {
        code: 400,
        status: 'Bad Request',
        message: `Can't get file outside drive.`
      }
    if (hasBlockedExtension(drivePath))
      throw {
        code: 400,
        status: 'Bad Request',
        message: 'Invalid file extension'
      }

    const store = nodeDriveStore()
    if (!(await store.exists(_filePath)))
      throw { code: 404, status: 'Not Found', message: `File doesn't exist.` }
    const stats = await store.stat(_filePath)
    streamDriveFile(request, _filePath, resolveDrivePath(_filePath), stats.size)
  }

  /**
   * Returns the names of the files and sub-folders directly inside a folder of
   * SASjs Drive. With no `_folderPath`, the drive root is listed.
   *
   * A `400` is returned for a path outside the drive and a `404` when the
   * folder does not exist.
   *
   * @summary List a folder in SASjs Drive
   * @param _folderPath Location of the folder within the drive
   * @example _folderPath "/Public/somefolder"
   */
  @Response(400, `Can't get folder outside drive`)
  @Response(404, `Folder doesn't exist`)
  @Get('/folder')
  public async getFolder(@Query() _folderPath?: string) {
    const { files, folders } = await answer(driveService().list(_folderPath))
    return { files, folders }
  }

  /**
   * Deletes a file from SASjs Drive.
   *
   * A `400` is returned for a path outside the drive and a `404` when the file
   * does not exist.
   *
   * @summary Delete a file from SASjs Drive
   * @param _filePath Location of the file within the drive
   * @example _filePath "/Public/somefolder/some.file"
   */
  @Response(400, `Can't delete file outside drive`)
  @Response(404, `File doesn't exist`)
  @Delete('/file')
  public async deleteFile(@Query() _filePath: string) {
    const { status } = await answer(driveService().remove(_filePath))
    // widened to string: the document describes the field as a plain string,
    // and the literal type is the package's, not the route's
    const widened: string = status
    return { status: widened }
  }

  /**
   * Deletes a folder, and everything inside it, from SASjs Drive.
   *
   * A `400` is returned for a path outside the drive and a `404` when the
   * folder does not exist.
   *
   * @summary Delete a folder from SASjs Drive
   * @param _folderPath Location of the folder within the drive
   * @example _folderPath "/Public/somefolder/"
   */
  @Response(400, `Can't delete folder outside drive`)
  @Response(404, `Folder doesn't exist`)
  @Delete('/folder')
  public async deleteFolder(@Query() _folderPath: string) {
    const { status } = await answer(driveService().rmdir(_folderPath))
    // widened to string: the document describes the field as a plain string,
    // and the literal type is the package's, not the route's
    const widened: string = status
    return { status: widened }
  }

  /**
   * Uploads a new file into SASjs Drive, creating any missing parent folders.
   *
   * The destination is given either as the `_filePath` query parameter or as the
   * `filePath` form field; one of the two is required. A `400` is returned for a
   * path outside the drive and a `409` when a file already exists at that path
   * (use `PATCH /SASjsApi/drive/file` to replace one).
   *
   * @summary Create a file in SASjs Drive
   * @param _filePath Location of the file within the drive
   * @example _filePath "/Public/somefolder/some.file.sas"
   */
  @Example<FileFolderResponse>({
    status: 'success'
  })
  @Response(400, `Can't put file outside drive`)
  @Response(409, 'File already exists')
  @Post('/file')
  public async saveFile(
    @UploadedFile() file: Express.Multer.File,
    @Query() _filePath?: string,
    @FormField() filePath?: string
  ): Promise<FileFolderResponse> {
    const contents = await readFileFromUpload(file)
    return answer(driveService().save((_filePath ?? filePath)!, contents))
  }

  /**
   * Creates an empty folder in SASjs Drive, including any missing parent
   * folders.
   *
   * A `400` is returned for a path outside the drive and a `409` when the folder
   * already exists.
   *
   * @summary Create a folder in SASjs Drive
   */
  @Example<FileFolderResponse>({
    status: 'success'
  })
  @Response(400, `Can't put folder outside drive`)
  @Response(409, 'Folder already exists')
  @Post('/folder')
  public async addFolder(
    @Body() body: AddFolderPayload
  ): Promise<FileFolderResponse> {
    return answer(driveService().mkdir(body.folderPath))
  }

  /**
   * Replaces the content of an existing file in SASjs Drive.
   *
   * The destination is given either as the `_filePath` query parameter or as the
   * `filePath` form field; one of the two is required. A `400` is returned for a
   * path outside the drive and a `404` when no file exists at that path.
   *
   * @summary Replace a file in SASjs Drive
   * @param _filePath Location of the file within the drive
   * @example _filePath "/Public/somefolder/some.file.sas"
   *
   */
  @Example<FileFolderResponse>({
    status: 'success'
  })
  @Response(400, `Can't modify file outside drive`)
  @Response(404, `File doesn't exist`)
  @Patch('/file')
  public async updateFile(
    @UploadedFile() file: Express.Multer.File,
    @Query() _filePath?: string,
    @FormField() filePath?: string
  ): Promise<FileFolderResponse> {
    const contents = await readFileFromUpload(file)
    return answer(driveService().update((_filePath ?? filePath)!, contents))
  }

  /**
   * Moves a file or folder within SASjs Drive to a new path.
   *
   * Both `oldPath` and `newPath` must be inside the drive: a `400` is returned
   * when either of them climbs out of it. A `404` is returned when nothing
   * exists at `oldPath`, and a `409` when something already exists at `newPath`.
   * A file may not be renamed into a name with a blocked extension, and a
   * folder may not be moved inside itself: both answer `400`.
   *
   * @summary Rename or move a file or folder in SASjs Drive
   */
  @Example<FileFolderResponse>({
    status: 'success'
  })
  @Response(400, `Can't rename outside drive`)
  @Response(409, 'Something already exists at the new path')
  @Response(404, 'No file/folder found for provided path')
  @Post('/rename')
  public async rename(
    @Body() body: RenamePayload
  ): Promise<FileFolderResponse> {
    return answer(driveService().rename(body.oldPath, body.newPath))
  }

  /**
   * Returns the folder-and-file tree of SASjs Drive, for rendering the drive
   * browser.
   *
   * With no `_folderPath` the whole tree is returned, which is kept for callers
   * that want to hash or mirror the drive in one request. With `_folderPath`
   * the response holds that folder and its IMMEDIATE children only, which is
   * what the Studio browser uses: it loads a level when a folder is expanded
   * rather than walking the entire drive on every page load. Each child folder
   * carries `hasChildren` so the caller can render an expander before
   * requesting that folder's contents.
   *
   * @summary Get the SASjs Drive file tree, or one folder of it
   * @param _folderPath Drive-relative folder path, e.g. /Public/services. An
   * empty value means the drive root; omit the parameter entirely for the whole
   * tree.
   */
  @Get('/filetree')
  public async getFileTree(
    @Query() _folderPath?: string
  ): Promise<GetFileTreeResponse> {
    return getFileTree(_folderPath)
  }
}

/**
 * An upload's bytes, and the upload folder kept clean. Multer has already
 * written the file to its upload folder; the drive takes the bytes from there
 * and the temp file is removed once they are read - on every path, not only
 * the failure path the route handles. A second removal (the route's own, on
 * failure) is tolerated: deleteFile is fs-extra's remove, which treats a
 * missing file as success.
 */
/**
 * Streams a drive file to the client: the type comes from a small ALLOWLIST
 * of extensions, everything else answering application/octet-stream - an
 * executable type (text/html, image/svg+xml) for caller-supplied bytes on
 * the API origin is the stored-XSS shape the fileTree route guards against,
 * and a drive file has no reason to render in a browser. sendFile derived
 * the type from the extension and would have answered text/html for
 * x.html; the drive does not. The bytes themselves stream, the way this
 * route always served them.
 */
const streamDriveFile = (
  request: express.Request,
  filePath: string,
  resolved: string,
  size: number
) => {
  const TEXT_TYPES: { [extension: string]: string } = {
    '.sas': 'text/plain',
    '.txt': 'text/plain',
    '.md': 'text/plain',
    '.csv': 'text/csv',
    '.json': 'application/json'
  }
  const extension = path.extname(filePath).toLowerCase()
  request.res?.type(TEXT_TYPES[extension] ?? 'application/octet-stream')

  request.res?.setHeader('X-Content-Type-Options', 'nosniff')
  request.res?.setHeader('Content-Length', String(size))

  request.res?.sendFile(resolved)
}

const readFileFromUpload = async (file: Express.Multer.File) => {
  try {
    return await fs.promises.readFile(file.path)
  } finally {
    // removed whether the read succeeded or threw: an upload that fails its
    // read must not leave the temp file behind either. The route's failure
    // path may remove it again; deleteFile treats a missing file as success.
    await deleteFile(file.path)
  }
}

const getFileTree = (folderPath?: string) => {
  const controller = new ExecutionController()

  const tree =
    folderPath === undefined
      ? controller.buildDirectoryTree()
      : controller.buildDirectoryLevel(folderPath)

  return { status: 'success', tree }
}

const deploy = async (data: DeployPayload) => {
  if (!isFileTree(data.fileTree)) {
    throw { code: 400, ...invalidDeployFormatResponse }
  }

  // appLoc is caller-supplied and every segment must stay a single path
  // segment: joined naively, '../' in a segment would make the deployment
  // root climb out of the drive (an arbitrary-file-write primitive).
  const appLocParts = data.appLoc.replace(/^\/+/, '').split('/')

  const appLocPath = resolveWithinDrive(data.appLoc)

  if (!appLocPath) {
    throw new Error('appLoc cannot be outside drive.')
  }

  await createFileTree(data.fileTree.members, appLocParts).catch((err) => {
    throw { code: 500, ...execDeployErrorResponse, ...err }
  })

  return successDeployResponse
}
