import { fileExists, readFile, createFile } from '@sasjs/utils'

export const sasjsDrive = async (
  filePath: string,
  action: string,
  newFileContent?: string
) => {
  let fileContent
  const isFileExists = await fileExists(filePath)
  if (isFileExists) {
    switch (action) {
      case 'read':
        fileContent = await readFile(filePath)
        return fileContent
      case 'update':
        if (newFileContent) {
          await createFile(filePath, newFileContent)
        }
        break
      default:
        break
    }
  }
}
