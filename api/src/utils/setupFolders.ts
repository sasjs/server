import { createFolder } from '@sasjs/utils'
import { getFilesFolder, getPackagesFolder } from './file'

export const setupFolders = async () => {
  await createFolder(getFilesFolder())
  await createFolder(getPackagesFolder())
}
