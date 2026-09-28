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
  deleteFolder as deleteFolderOnSystem,
  folderExists,
  listFilesInFolder,
  listSubFoldersInFolder,
  isFolder,
  FileTree,
  isFileTree
} from '@sasjs/utils'
import { createFileTree, ExecutionController, getTreeExample } from './internal'

import { TreeNode } from '../types'
import { getFilesFolder, resolveWithinDrive } from '../utils'

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

@Security('bearerAuth')
@Route('SASjsApi/drive')
@Tags('Drive')
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
  @Get('/file')
  public async getFile(
    @Request() request: express.Request,
    @Query() _filePath: string
  ) {
    return getFile(request, _filePath)
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
  @Get('/folder')
  public async getFolder(@Query() _folderPath?: string) {
    return getFolder(_folderPath)
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
  @Delete('/file')
  public async deleteFile(@Query() _filePath: string) {
    return deleteFile(_filePath)
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
  @Delete('/folder')
  public async deleteFolder(@Query() _folderPath: string) {
    return deleteFolder(_folderPath)
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
  @Response<FileFolderResponse>(403, 'File already exists', {
    status: 'failure',
    message: 'File request failed.'
  })
  @Post('/file')
  public async saveFile(
    @UploadedFile() file: Express.Multer.File,
    @Query() _filePath?: string,
    @FormField() filePath?: string
  ): Promise<FileFolderResponse> {
    return saveFile((_filePath ?? filePath)!, file)
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
  @Response<FileFolderResponse>(409, 'Folder already exists', {
    status: 'failure',
    message: 'Add folder request failed.'
  })
  @Post('/folder')
  public async addFolder(
    @Body() body: AddFolderPayload
  ): Promise<FileFolderResponse> {
    return addFolder(body.folderPath)
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
  @Response<FileFolderResponse>(403, `File doesn't exist`, {
    status: 'failure',
    message: 'File request failed.'
  })
  @Patch('/file')
  public async updateFile(
    @UploadedFile() file: Express.Multer.File,
    @Query() _filePath?: string,
    @FormField() filePath?: string
  ): Promise<FileFolderResponse> {
    return updateFile((_filePath ?? filePath)!, file)
  }

  /**
   * Moves a file or folder within SASjs Drive to a new path.
   *
   * Both `oldPath` and `newPath` must be inside the drive. A `404` is returned
   * when nothing exists at `oldPath`, and a `409` when something already exists
   * at `newPath`.
   *
   * @summary Rename or move a file or folder in SASjs Drive
   */
  @Example<FileFolderResponse>({
    status: 'success'
  })
  @Response<FileFolderResponse>(409, 'Folder already exists', {
    status: 'failure',
    message: 'rename request failed.'
  })
  @Post('/rename')
  public async rename(
    @Body() body: RenamePayload
  ): Promise<FileFolderResponse> {
    return rename(body.oldPath, body.newPath)
  }

  /**
   * Returns the full folder-and-file tree of SASjs Drive, for rendering the
   * drive browser.
   *
   * @summary Get the SASjs Drive file tree
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

const getFile = async (req: express.Request, filePath: string) => {
  const filePathFull = resolveWithinDrive(filePath)

  if (!filePathFull)
    throw {
      code: 400,
      status: 'Bad Request',
      message: `Can't get file outside drive.`
    }

  if (!(await fileExists(filePathFull)))
    throw {
      code: 404,
      status: 'Not Found',
      message: `File doesn't exist.`
    }

  const extension = path.extname(filePathFull).toLowerCase()
  if (extension === '.sas') {
    req.res?.setHeader('Content-type', 'text/plain')
  }

  req.res?.sendFile(path.resolve(filePathFull), { dotfiles: 'allow' })
}

const getFolder = async (folderPath?: string) => {
  const driveFilesPath = getFilesFolder()

  if (folderPath) {
    const folderPathFull = resolveWithinDrive(folderPath)

    if (!folderPathFull)
      throw {
        code: 400,
        status: 'Bad Request',
        message: `Can't get folder outside drive.`
      }

    if (!(await folderExists(folderPathFull)))
      throw {
        code: 404,
        status: 'Not Found',
        message: `Folder doesn't exist.`
      }

    if (!(await isFolder(folderPathFull)))
      throw {
        code: 400,
        status: 'Bad Request',
        message: 'Not a Folder.'
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
  const filePathFull = resolveWithinDrive(filePath)

  if (!filePathFull)
    throw {
      code: 400,
      status: 'Bad Request',
      message: `Can't delete file outside drive.`
    }

  if (!(await fileExists(filePathFull)))
    throw {
      code: 404,
      status: 'Not Found',
      message: `File doesn't exist.`
    }

  await deleteFileOnSystem(filePathFull)

  return { status: 'success' }
}

const deleteFolder = async (folderPath: string) => {
  const folderPathFull = resolveWithinDrive(folderPath)

  if (!folderPathFull)
    throw {
      code: 400,
      status: 'Bad Request',
      message: `Can't delete folder outside drive.`
    }

  if (!(await folderExists(folderPathFull)))
    throw {
      code: 404,
      status: 'Not Found',
      message: `Folder doesn't exist.`
    }

  await deleteFolderOnSystem(folderPathFull)

  return { status: 'success' }
}

const saveFile = async (
  filePath: string,
  multerFile: Express.Multer.File
): Promise<GetFileResponse> => {
  const filePathFull = resolveWithinDrive(filePath)

  if (!filePathFull)
    throw {
      code: 400,
      status: 'Bad Request',
      message: `Can't put file outside drive.`
    }

  if (await fileExists(filePathFull))
    throw {
      code: 409,
      status: 'Conflict',
      message: 'File already exists.'
    }

  const folderPath = path.dirname(filePathFull)
  await createFolder(folderPath)
  await moveFile(multerFile.path, filePathFull)

  return { status: 'success' }
}

const addFolder = async (folderPath: string): Promise<FileFolderResponse> => {
  const folderPathFull = resolveWithinDrive(folderPath)

  if (!folderPathFull)
    throw {
      code: 400,
      status: 'Bad Request',
      message: `Can't put folder outside drive.`
    }

  if (await folderExists(folderPathFull))
    throw {
      code: 409,
      status: 'Conflict',
      message: 'Folder already exists.'
    }

  await createFolder(folderPathFull)

  return { status: 'success' }
}

const rename = async (
  oldPath: string,
  newPath: string
): Promise<FileFolderResponse> => {
  const oldPathFull = resolveWithinDrive(oldPath)
  const newPathFull = resolveWithinDrive(newPath)

  if (!oldPathFull)
    throw {
      code: 400,
      status: 'Bad Request',
      message: `Old path can't be outside of drive.`
    }

  if (!newPathFull)
    throw {
      code: 400,
      status: 'Bad Request',
      message: `New path can't be outside of drive.`
    }

  if (await isFolder(oldPathFull)) {
    if (await folderExists(newPathFull))
      throw {
        code: 409,
        status: 'Conflict',
        message: 'Folder with new name already exists.'
      }
    else moveFile(oldPathFull, newPathFull)

    return { status: 'success' }
  } else if (await fileExists(oldPathFull)) {
    if (await fileExists(newPathFull))
      throw {
        code: 409,
        status: 'Conflict',
        message: 'File with new name already exists.'
      }
    else moveFile(oldPathFull, newPathFull)
    return { status: 'success' }
  }

  throw {
    code: 404,
    status: 'Not Found',
    message: 'No file/folder found for provided path.'
  }
}

const updateFile = async (
  filePath: string,
  multerFile: Express.Multer.File
): Promise<GetFileResponse> => {
  const filePathFull = resolveWithinDrive(filePath)

  if (!filePathFull)
    throw {
      code: 400,
      status: 'Bad Request',
      message: `Can't modify file outside drive.`
    }

  if (!(await fileExists(filePathFull)))
    throw {
      code: 404,
      status: 'Not Found',
      message: `File doesn't exist.`
    }

  await moveFile(multerFile.path, filePathFull)

  return { status: 'success' }
}
