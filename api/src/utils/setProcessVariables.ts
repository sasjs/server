import path from 'path'
import { getRealPath } from '@sasjs/utils'

import { configuration } from '../../package.json'
import { getDesktopFields } from '.'

export const setProcessVariables = async () => {
  if (process.env.NODE_ENV === 'test') {
    process.driveLoc = path.join(process.cwd(), 'tmp')
    return
  }

  const { MODE } = process.env

  if (MODE?.trim() !== 'server') {
    const { sasLoc, driveLoc } = await getDesktopFields()

    process.sasLoc = sasLoc
    process.driveLoc = driveLoc
  } else {
    const { SAS_PATH, DRIVE_PATH } = process.env

    process.sasLoc = SAS_PATH ?? configuration.sasPath
    process.driveLoc = getRealPath(
      path.join(process.cwd(), DRIVE_PATH ?? 'tmp')
    )
  }

  console.log('sasLoc: ', process.sasLoc)
  console.log('sasDrive: ', process.driveLoc)
}
