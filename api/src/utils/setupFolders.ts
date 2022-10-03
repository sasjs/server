import { createFile, createFolder, fileExists } from '@sasjs/utils'
import {
  getDesktopUserAutoExecPath,
  getFilesFolder,
  getPackagesFolder
} from './file'
import { ModeType } from './verifyEnvVariables'

export const setupFolders = async () => {
  const drivePath = getFilesFolder()
  await createFolder(drivePath)
  await createFolder(getPackagesFolder())

  if (process.env.MODE === ModeType.Desktop) {
    if (!(await fileExists(getDesktopUserAutoExecPath()))) {
      await createFile(getDesktopUserAutoExecPath(), '')
    }
  }
}
