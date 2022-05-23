import { createFolder } from '@sasjs/utils'
import { getFilesFolder } from './file'

export const setupFolders = async () => {
  const drivePath = getFilesFolder()
  await createFolder(drivePath)
}
