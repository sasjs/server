import path from 'path'
import { createFolder, getAbsolutePath, getRealPath } from '@sasjs/utils'

import { getDesktopFields, ModeType, RunTimeType } from '.'

export const setProcessVariables = async () => {
  if (process.env.NODE_ENV === 'test') {
    process.driveLoc = path.join(process.cwd(), 'sasjs_root')
    return
  }

  const { MODE } = process.env

  if (MODE === ModeType.Server) {
    process.sasLoc = process.env.SAS_PATH as string
    process.nodeLoc = process.env.NODE_PATH as string
  } else {
    const { sasLoc, nodeLoc } = await getDesktopFields()

    process.sasLoc = sasLoc
    process.nodeLoc = nodeLoc
  }

  const { SASJS_ROOT } = process.env
  const absPath = getAbsolutePath(SASJS_ROOT ?? 'sasjs_root', process.cwd())
  await createFolder(absPath)
  process.driveLoc = getRealPath(absPath)

  const { RUN_TIMES } = process.env
  process.runTimes = (RUN_TIMES as string).split(',') as RunTimeType[]

  console.log('sasLoc: ', process.sasLoc)
  console.log('sasDrive: ', process.driveLoc)
  console.log('runTimes: ', process.runTimes)
}
