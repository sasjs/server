import { Security, Route, Tags, Example, Post, Body, Response } from 'tsoa'
import { fileExists, readFile, createFile } from '@sasjs/utils'
import { createFileTree, getTreeExample } from '.'

import { FileTree, isFileTree } from '../types'

interface DeployPayload {
  appLoc?: string
  fileTree: FileTree
}

interface DeployResponse {
  status: string
  message: string
  example?: FileTree
}

const fileTreeExample = getTreeExample()

const successResponse: DeployResponse = {
  status: 'success',
  message: 'Files deployed successfully to @sasjs/server.'
}
const invalidFormatResponse: DeployResponse = {
  status: 'failure',
  message: 'Provided not supported data format.',
  example: fileTreeExample
}
const execErrorResponse: DeployResponse = {
  status: 'failure',
  message: 'Deployment failed!'
}

@Security('bearerAuth')
@Route('SASjsApi/drive')
@Tags('Drive')
export class DriveController {
  /**
   * Creates/updates files within SASjs Drive using provided payload.
   *
   */
  @Example<DeployResponse>(successResponse)
  @Response<DeployResponse>(400, 'Invalid Format', invalidFormatResponse)
  @Response<DeployResponse>(500, 'Execution Error', execErrorResponse)
  @Post('/deploy')
  public async deploy(@Body() body: DeployPayload): Promise<DeployResponse> {
    return deploy(body)
  }

  async readFile(filePath: string) {
    await this.validateFilePath(filePath)
    return await readFile(filePath)
  }

  async updateFile(filePath: string, fileContent: string) {
    await this.validateFilePath(filePath)
    return await createFile(filePath, fileContent)
  }

  private async validateFilePath(filePath: string) {
    if (!(await fileExists(filePath))) {
      throw 'DriveController: File does not exists.'
    }
  }
}

const deploy = async (data: DeployPayload) => {
  if (!isFileTree(data.fileTree)) {
    throw { code: 400, ...invalidFormatResponse }
  }

  await createFileTree(
    data.fileTree.members,
    data.appLoc ? data.appLoc.replace(/^\//, '').split('/') : []
  ).catch((err) => {
    throw { code: 500, ...execErrorResponse, ...err }
  })

  return successResponse
}
