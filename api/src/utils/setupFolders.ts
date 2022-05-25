import { createFile, createFolder, fileExists } from '@sasjs/utils'
import { getDesktopUserAutoExecPath, getFilesFolder } from './file'
import { ModeType } from './verifyEnvVariables'

export const setupFolders = async () => {
  const drivePath = getFilesFolder()
  await createFolder(drivePath)

  if (process.env.MODE === ModeType.Desktop) {
    if (!(await fileExists(getDesktopUserAutoExecPath()))) {
      await createFile(getDesktopUserAutoExecPath(), '')
    }
  }
}
