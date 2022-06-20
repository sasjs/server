import path from 'path'
import { getString } from '@sasjs/utils/input'
import { createFolder, fileExists, folderExists } from '@sasjs/utils'

const isWindows = () => process.platform === 'win32'

export const getDesktopFields = async () => {
  const { SAS_PATH, NODE_PATH } = process.env

  const sasLoc = SAS_PATH ?? (await getSASLocation())
  const nodeLoc = NODE_PATH ?? (await getNodeLocation())
  // const driveLoc = DRIVE_PATH ?? (await getDriveLocation())

  return { sasLoc, nodeLoc }
}

const getDriveLocation = async (): Promise<string> => {
  const validator = async (filePath: string) => {
    if (!filePath) return 'Path to files/drive is required.'

    const drivePath = path.join(process.cwd(), filePath)

    if (!(await folderExists(drivePath))) {
      await createFolder(drivePath)
      await createFolder(path.join(drivePath, 'files'))
    }

    return true
  }

  const defaultLocation = isWindows() ? '.\\tmp\\' : './tmp/'

  const targetName = await getString(
    'Please enter path to file/drive (relative to executable): ',
    validator,
    defaultLocation
  )

  return targetName
}

const getSASLocation = async (): Promise<string> => {
  const validator = async (filePath: string) => {
    if (!filePath) return 'Path to SAS executable is required.'

    if (!(await fileExists(filePath))) {
      return 'No file found at provided path.'
    }

    return true
  }

  const defaultLocation = isWindows()
    ? 'C:\\Program Files\\SASHome\\SASFoundation\\9.4\\sas.exe'
    : '/opt/sas/sas9/SASHome/SASFoundation/9.4/sasexe/sas'

  const targetName = await getString(
    'Please enter full path to a SAS executable with UTF-8 encoding: ',
    validator,
    defaultLocation
  )

  return targetName
}

const getNodeLocation = async (): Promise<string> => {
  const validator = async (filePath: string) => {
    if (!filePath) return 'Path to NodeJS executable is required.'

    if (!(await fileExists(filePath))) {
      return 'No file found at provided path.'
    }

    return true
  }

  const defaultLocation = isWindows()
    ? 'C:\\Program Files\\nodejs\\node.exe'
    : '/usr/local/nodejs/bin/node.sh'

  const targetName = await getString(
    'Please enter full path to a NodeJS executable: ',
    validator,
    defaultLocation
  )

  return targetName
}
