import path from 'path'
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
  Query,
  Get,
  Patch,
  UploadedFile,
  FormField,
  Delete,
  Hidden
} from 'tsoa'
import {
  fileExists,
  moveFile,
  createFolder,
  deleteFile as deleteFileOnSystem,
  folderExists,
  listFilesInFolder,
  listSubFoldersInFolder,
  isFolder,
  FileTree,
  isFileTree
} from '@sasjs/utils'
import { createFileTree, ExecutionController, getTreeExample } from './internal'

import { TreeNode } from '../types'
import { getFilesFolder } from '../utils'

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

interface UpdateFileResponse {
  status: string
  message?: string
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

@Security('bearerAuth')
@Route('SASjsApi/drive')
@Tags('Drive')
export class DriveController {
  /**
   * @summary Creates/updates files within SASjs Drive using provided payload.
   *
   */
  @Example<DeployResponse>(successDeployResponse)
  @Response<DeployResponse>(400, 'Invalid Format', invalidDeployFormatResponse)
  @Response<DeployResponse>(500, 'Execution Error', execDeployErrorResponse)
  @Post('/deploy')
  public async deploy(@Body() body: DeployPayload): Promise<DeployResponse> {
    return deploy(body)
  }

  /**
   * Accepts JSON file and zipped compressed JSON file as well.
   * Compressed file should only contain one JSON file and should have same name
   * as of compressed file e.g. deploy.JSON should be compressed to deploy.JSON.zip
   * Any other file or JSON file in zipped will be ignored!
   *
   * @summary Creates/updates files within SASjs Drive using uploaded JSON/compressed JSON file.
   *
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
   *
   * @summary Get file from SASjs Drive
   * @query _filePath Location of SAS program
   * @example _filePath "/Public/somefolder/some.file"
   */
  @Get('/file')
  public async getFile(
    @Request() request: express.Request,
    @Query() _filePath: string
  ) {
    return getFile(request, _filePath)
  }

  /**
   *
   * @summary Get folder contents from SASjs Drive
   * @query _folderPath Location of SAS program
   * @example _folderPath "/Public/somefolder"
   */
  @Get('/folder')
  public async getFolder(@Query() _folderPath?: string) {
    return getFolder(_folderPath)
  }

  /**
   *
   * @summary Delete file from SASjs Drive
   * @query _filePath Location of SAS program
   * @example _filePath "/Public/somefolder/some.file"
   */
  @Delete('/file')
  public async deleteFile(@Query() _filePath: string) {
    return deleteFile(_filePath)
  }

  /**
   * It's optional to either provide `_filePath` in url as query parameter
   * Or provide `filePath` in body as form field.
   * But it's required to provide else API will respond with Bad Request.
   *
   * @summary Create a file in SASjs Drive
   * @param _filePath Location of SAS program
   * @example _filePath "/Public/somefolder/some.file.sas"
   *
   */
  @Example<UpdateFileResponse>({
    status: 'success'
  })
  @Response<UpdateFileResponse>(403, 'File already exists', {
    status: 'failure',
    message: 'File request failed.'
  })
  @Post('/file')
  public async saveFile(
    @UploadedFile() file: Express.Multer.File,
    @Query() _filePath?: string,
    @FormField() filePath?: string
  ): Promise<UpdateFileResponse> {
    return saveFile((_filePath ?? filePath)!, file)
  }

  /**
   * It's optional to either provide `_filePath` in url as query parameter
   * Or provide `filePath` in body as form field.
   * But it's required to provide else API will respond with Bad Request.
   *
   * @summary Modify a file in SASjs Drive
   * @param _filePath Location of SAS program
   * @example _filePath "/Public/somefolder/some.file.sas"
   *
   */
  @Example<UpdateFileResponse>({
    status: 'success'
  })
  @Response<UpdateFileResponse>(403, `File doesn't exist`, {
    status: 'failure',
    message: 'File request failed.'
  })
  @Patch('/file')
  public async updateFile(
    @UploadedFile() file: Express.Multer.File,
    @Query() _filePath?: string,
    @FormField() filePath?: string
  ): Promise<UpdateFileResponse> {
    return updateFile((_filePath ?? filePath)!, file)
  }

  /**
   * @summary Fetch file tree within SASjs Drive.
   *
   */
  @Get('/filetree')
  public async getFileTree(): Promise<GetFileTreeResponse> {
    return getFileTree()
  }
}

const getFileTree = () => {
  const tree = new ExecutionController().buildDirectoryTree()
  return { status: 'success', tree }
}

const deploy = async (data: DeployPayload) => {
  const driveFilesPath = getFilesFolder()

  const appLocParts = data.appLoc.replace(/^\//, '').split('/')

  const appLocPath = path
    .join(getFilesFolder(), ...appLocParts)
    .replace(new RegExp('/', 'g'), path.sep)

  if (!appLocPath.includes(driveFilesPath)) {
    throw new Error('appLoc cannot be outside drive.')
  }

  if (!isFileTree(data.fileTree)) {
    throw { code: 400, ...invalidDeployFormatResponse }
  }

  await createFileTree(data.fileTree.members, appLocParts).catch((err) => {
    throw { code: 500, ...execDeployErrorResponse, ...err }
  })

  return successDeployResponse
}

const getFile = async (req: express.Request, filePath: string) => {
  const driveFilesPath = getFilesFolder()

  const filePathFull = path
    .join(getFilesFolder(), filePath)
    .replace(new RegExp('/', 'g'), path.sep)

  if (!filePathFull.includes(driveFilesPath)) {
    throw new Error('Cannot get file outside drive.')
  }

  if (!(await fileExists(filePathFull))) {
    throw new Error("File doesn't exist.")
  }

  const extension = path.extname(filePathFull).toLowerCase()
  if (extension === '.sas') {
    req.res?.setHeader('Content-type', 'text/plain')
  }

  req.res?.sendFile(path.resolve(filePathFull))
}

const getFolder = async (folderPath?: string) => {
  const driveFilesPath = getFilesFolder()

  if (folderPath) {
    const folderPathFull = path
      .join(getFilesFolder(), folderPath)
      .replace(new RegExp('/', 'g'), path.sep)

    if (!folderPathFull.includes(driveFilesPath)) {
      throw new Error('Cannot get folder outside drive.')
    }

    if (!(await folderExists(folderPathFull))) {
      throw new Error("Folder doesn't exist.")
    }

    if (!(await isFolder(folderPathFull))) {
      throw new Error('Not a Folder.')
    }

    const files: string[] = await listFilesInFolder(folderPathFull)
    const folders: string[] = await listSubFoldersInFolder(folderPathFull)
    return { files, folders }
  }

  const files: string[] = await listFilesInFolder(driveFilesPath)
  const folders: string[] = await listSubFoldersInFolder(driveFilesPath)
  return { files, folders }
}

const deleteFile = async (filePath: string) => {
  const driveFilesPath = getFilesFolder()

  const filePathFull = path
    .join(getFilesFolder(), filePath)
    .replace(new RegExp('/', 'g'), path.sep)

  if (!filePathFull.includes(driveFilesPath)) {
    throw new Error('Cannot delete file outside drive.')
  }

  if (!(await fileExists(filePathFull))) {
    throw new Error('File does not exist.')
  }

  await deleteFileOnSystem(filePathFull)

  return { status: 'success' }
}

const saveFile = async (
  filePath: string,
  multerFile: Express.Multer.File
): Promise<GetFileResponse> => {
  const driveFilesPath = getFilesFolder()

  const filePathFull = path
    .join(driveFilesPath, filePath)
    .replace(new RegExp('/', 'g'), path.sep)

  if (!filePathFull.includes(driveFilesPath)) {
    throw new Error('Cannot put file outside drive.')
  }

  if (await fileExists(filePathFull)) {
    throw new Error('File already exists.')
  }

  const folderPath = path.dirname(filePathFull)
  await createFolder(folderPath)
  await moveFile(multerFile.path, filePathFull)

  return { status: 'success' }
}

const updateFile = async (
  filePath: string,
  multerFile: Express.Multer.File
): Promise<GetFileResponse> => {
  const driveFilesPath = getFilesFolder()

  const filePathFull = path
    .join(driveFilesPath, filePath)
    .replace(new RegExp('/', 'g'), path.sep)

  if (!filePathFull.includes(driveFilesPath)) {
    throw new Error('Cannot modify file outside drive.')
  }

  if (!(await fileExists(filePathFull))) {
    throw new Error(`File doesn't exist.`)
  }

  await moveFile(multerFile.path, filePathFull)

  return { status: 'success' }
}
