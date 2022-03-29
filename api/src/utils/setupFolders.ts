import { createFolder } from '@sasjs/utils'
import { getTmpFilesFolderPath } from './file'

export const setupFolders = async () => {
  const drivePath = getTmpFilesFolderPath()
  await createFolder(drivePath)
}
