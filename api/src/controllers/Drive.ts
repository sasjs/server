import { fileExists, readFile, createFile } from '@sasjs/utils'

export class DriveController {
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
