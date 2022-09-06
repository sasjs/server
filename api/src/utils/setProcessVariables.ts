import path from 'path'
import { createFolder, getAbsolutePath, getRealPath } from '@sasjs/utils'

import { connectDB, getDesktopFields, ModeType, RunTimeType, SECRETS } from '.'

export const setProcessVariables = async () => {
  const { MODE, RUN_TIMES } = process.env

  if (MODE === ModeType.Server) {
    // NOTE: when exporting app.js as agent for supertest
    // it should prevent connecting to the real database
    if (process.env.NODE_ENV !== 'test') {
      const secrets = await connectDB()

      process.secrets = secrets
    } else {
      process.secrets = SECRETS
    }
  }

  if (process.env.NODE_ENV === 'test') {
    process.driveLoc = path.join(process.cwd(), 'sasjs_root')
    return
  }

  process.runTimes = (RUN_TIMES?.split(',') as RunTimeType[]) ?? []

  if (MODE === ModeType.Server) {
    process.sasLoc = process.env.SAS_PATH
    process.nodeLoc = process.env.NODE_PATH
    process.pythonLoc = process.env.PYTHON_PATH
    process.rscriptLoc = process.env.RSCRIPT_PATH
  } else {
    const { sasLoc, nodeLoc, pythonLoc, rscriptLoc } = await getDesktopFields()

    process.sasLoc = sasLoc
    process.nodeLoc = nodeLoc
    process.pythonLoc = pythonLoc
    process.rscriptLoc = rscriptLoc
  }

  const { SASJS_ROOT } = process.env
  const absPath = getAbsolutePath(SASJS_ROOT ?? 'sasjs_root', process.cwd())
  await createFolder(absPath)
  process.driveLoc = getRealPath(absPath)

  const { LOG_LOCATION } = process.env
  const absLogsPath = getAbsolutePath(
    LOG_LOCATION ?? `sasjs_root${path.sep}logs`,
    process.cwd()
  )
  await createFolder(absLogsPath)
  process.logsLoc = getRealPath(absLogsPath)

  process.logsUUID = 'SASJS_LOGS_SEPARATOR_163ee17b6ff24f028928972d80a26784'

  console.log('sasLoc: ', process.sasLoc)
  console.log('sasDrive: ', process.driveLoc)
  console.log('sasLogs: ', process.logsLoc)
  console.log('runTimes: ', process.runTimes)
}
