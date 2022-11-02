import { createFile, fileExists } from '@sasjs/utils'
import { getDesktopUserAutoExecPath } from './file'
import { ModeType } from './verifyEnvVariables'

export const setupUserAutoExec = async () => {
  if (process.env.MODE === ModeType.Desktop) {
    if (!(await fileExists(getDesktopUserAutoExecPath()))) {
      await createFile(getDesktopUserAutoExecPath(), '')
    }
  }
}
