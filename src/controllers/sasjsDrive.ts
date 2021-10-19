import { fileExists, readFile, createFile } from '@sasjs/utils'

export class SASjsDriveController {
  async readFile(filePath: string) {
    if (await fileExists(filePath)) {
      return await readFile(filePath)
    }
  }

  async updateFile(filePath: string, fileContent: string) {
    if (await fileExists(filePath)) {
      return await createFile(filePath, fileContent)
    }
  }
}
