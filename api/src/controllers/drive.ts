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
  FormField
} from 'tsoa'
import { fileExists, createFile, moveFile, createFolder } from '@sasjs/utils'
import { createFileTree, ExecutionController, getTreeExample } from './internal'

import { FileTree, isFileTree, TreeNode } from '../types'
import { getTmpFilesFolderPath } from '../utils'

interface DeployPayload {
  appLoc?: string
  fileTree: FileTree
}
interface FilePayload {
  /**
   * Path of the file
   * @example "/Public/somefolder/some.file"
   */
  filePath: string
  /**
   * Contents of the file
   * @example "Contents of the File"
   */
  fileContent: string
}

interface DeployResponse {
  status: string
  message: string
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
   * @summary Get file from SASjs Drive
   * @query filePath Location of SAS program
   * @example filePath "/Public/somefolder/some.file"
   */
  @Get('/file')
  public async getFile(
    @Request() request: express.Request,
    @Query() filePath: string
  ) {
    return getFile(request, filePath)
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
  if (!isFileTree(data.fileTree)) {
    throw { code: 400, ...invalidDeployFormatResponse }
  }

  await createFileTree(
    data.fileTree.members,
    data.appLoc ? data.appLoc.replace(/^\//, '').split('/') : []
  ).catch((err) => {
    throw { code: 500, ...execDeployErrorResponse, ...err }
  })

  return successDeployResponse
}

const getFile = async (req: express.Request, filePath: string) => {
  const driveFilesPath = getTmpFilesFolderPath()

  const filePathFull = path
    .join(getTmpFilesFolderPath(), filePath)
    .replace(new RegExp('/', 'g'), path.sep)

  if (!filePathFull.includes(driveFilesPath)) {
    throw new Error('Cannot get file outside drive.')
  }

  if (!(await fileExists(filePathFull))) {
    throw new Error('File does not exist.')
  }

  const extension = path.extname(filePathFull).toLowerCase()
  if (extension === '.sas') {
    req.res?.setHeader('Content-type', 'text/plain')
  }

  req.res?.sendFile(path.resolve(filePathFull))
}

const saveFile = async (
  filePath: string,
  multerFile: Express.Multer.File
): Promise<GetFileResponse> => {
  const driveFilesPath = getTmpFilesFolderPath()

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
  const driveFilesPath = getTmpFilesFolderPath()

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

const validateFilePath = async (filePath: string) => {
  if (!(await fileExists(filePath))) {
    throw 'DriveController: File does not exists.'
  }
}
