import path from 'path'
import { createFolder, getAbsolutePath, getRealPath } from '@sasjs/utils'

import { getDesktopFields, ModeType } from '.'

export const setProcessVariables = async () => {
  if (process.env.NODE_ENV === 'test') {
    process.driveLoc = path.join(process.cwd(), 'sasjs_root')
    return
  }

  const { MODE } = process.env

  if (MODE === ModeType.Server) {
    process.sasLoc = process.env.SAS_PATH as string
  } else {
    const { sasLoc } = await getDesktopFields()

    process.sasLoc = sasLoc
  }

  const { SASJS_ROOT } = process.env
  const absPath = getAbsolutePath(SASJS_ROOT ?? 'sasjs_root', process.cwd())
  await createFolder(absPath)
  process.driveLoc = getRealPath(absPath)

  console.log('sasLoc: ', process.sasLoc)
  console.log('sasDrive: ', process.driveLoc)
}
