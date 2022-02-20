import {
  Security,
  Route,
  Tags,
  Example,
  Post,
  Body,
  Response,
  Query,
  Get,
  Patch
} from 'tsoa'
import { fileExists, readFile, createFile } from '@sasjs/utils'
import { createFileTree, ExecutionController, getTreeExample } from './internal'

import { FileTree, isFileTree, TreeNode } from '../types'
import path from 'path'
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
   * @param filePath Location of SAS program
   * @example filePath "/Public/somefolder/some.file"
   */
  @Example<GetFileResponse>({
    status: 'success',
    fileContent: 'Contents of the File'
  })
  @Response<GetFileResponse>(400, 'Unable to get File', {
    status: 'failure',
    message: 'File request failed.'
  })
  @Get('/file')
  public async getFile(@Query() filePath: string): Promise<GetFileResponse> {
    return getFile(filePath)
  }

  /**
   * @summary Create a file in SASjs Drive
   *
   */
  @Example<UpdateFileResponse>({
    status: 'success'
  })
  @Response<UpdateFileResponse>(400, 'File already exists', {
    status: 'failure',
    message: 'File request failed.'
  })
  @Post('/file')
  public async saveFile(
    @Body() body: FilePayload
  ): Promise<UpdateFileResponse> {
    return saveFile(body)
  }

  /**
   * @summary Modify a file in SASjs Drive
   *
   */
  @Example<UpdateFileResponse>({
    status: 'success'
  })
  @Response<UpdateFileResponse>(400, 'Unable to get File', {
    status: 'failure',
    message: 'File request failed.'
  })
  @Patch('/file')
  public async updateFile(
    @Body() body: FilePayload
  ): Promise<UpdateFileResponse> {
    return updateFile(body)
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

const getFile = async (filePath: string): Promise<GetFileResponse> => {
  try {
    const filePathFull = path
      .join(getTmpFilesFolderPath(), filePath)
      .replace(new RegExp('/', 'g'), path.sep)

    await validateFilePath(filePathFull)
    const fileContent = await readFile(filePathFull)

    return { status: 'success', fileContent: fileContent }
  } catch (err: any) {
    throw {
      code: 400,
      status: 'failure',
      message: 'File request failed.',
      error: typeof err === 'object' ? err.toString() : err
    }
  }
}

const saveFile = async (body: FilePayload): Promise<GetFileResponse> => {
  const { filePath, fileContent } = body
  try {
    const filePathFull = path
      .join(getTmpFilesFolderPath(), filePath)
      .replace(new RegExp('/', 'g'), path.sep)

    if (await fileExists(filePathFull)) {
      throw 'DriveController: File already exists.'
    }
    await createFile(filePathFull, fileContent)

    return { status: 'success' }
  } catch (err: any) {
    throw {
      code: 400,
      status: 'failure',
      message: 'File request failed.',
      error: typeof err === 'object' ? err.toString() : err
    }
  }
}

const updateFile = async (body: FilePayload): Promise<GetFileResponse> => {
  const { filePath, fileContent } = body
  try {
    const filePathFull = path
      .join(getTmpFilesFolderPath(), filePath)
      .replace(new RegExp('/', 'g'), path.sep)

    await validateFilePath(filePathFull)
    await createFile(filePathFull, fileContent)

    return { status: 'success' }
  } catch (err: any) {
    throw {
      code: 400,
      status: 'failure',
      message: 'File request failed.',
      error: typeof err === 'object' ? err.toString() : err
    }
  }
}

const validateFilePath = async (filePath: string) => {
  if (!(await fileExists(filePath))) {
    throw 'DriveController: File does not exists.'
  }
}
