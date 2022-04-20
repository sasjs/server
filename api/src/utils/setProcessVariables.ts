import path from 'path'
import { getAbsolutePath, getRealPath } from '@sasjs/utils'

import { configuration } from '../../package.json'
import { getDesktopFields } from '.'

export const setProcessVariables = async () => {
  if (process.env.NODE_ENV === 'test') {
    process.driveLoc = path.join(process.cwd(), 'tmp')
    return
  }

  const { MODE } = process.env

  if (MODE?.trim() === 'server') {
    const { SAS_PATH, DRIVE_PATH } = process.env

    process.sasLoc = SAS_PATH ?? configuration.sasPath
    const absPath = getAbsolutePath(DRIVE_PATH ?? 'tmp', process.cwd())
    process.driveLoc = getRealPath(absPath)
  } else {
    const { sasLoc, driveLoc } = await getDesktopFields()

    process.sasLoc = sasLoc
    process.driveLoc = driveLoc
  }

  console.log('sasLoc: ', process.sasLoc)
  console.log('sasDrive: ', process.driveLoc)
}
