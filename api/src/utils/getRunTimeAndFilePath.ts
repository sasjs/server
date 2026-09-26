import path from 'path'
import { fileExists } from '@sasjs/utils'
import { getFilesFolder } from './file'
import { resolveWithinDrive } from './resolveWithinDrive'
import { RunTimeType } from '.'

export const getRunTimeAndFilePath = async (programPath: string) => {
  // _program is caller-controlled and names a file under the SASjs Drive.
  // Resolve it against the drive root and refuse anything that escapes -
  // path.join alone happily follows '../..' to any directory the service
  // account can read (and execute: SAS, JS, PY and R files all run through
  // here).
  const resolvedProgramPath = resolveWithinDrive(programPath)

  if (!resolvedProgramPath)
    throw `The Program at (${programPath}) does not exist.`

  const ext = path.extname(resolvedProgramPath).toLowerCase()
  // If programPath (_program) is provided with a ".sas", ".js", ".py" or ".r" extension
  // we should use that extension to determine the appropriate runTime
  if (ext && Object.values(RunTimeType).includes(ext.slice(1) as RunTimeType)) {
    const runTime = ext.slice(1)

    if (await fileExists(resolvedProgramPath)) {
      return { codePath: resolvedProgramPath, runTime: runTime as RunTimeType }
    }
  } else {
    for (const runTime of process.runTimes) {
      const codePath = resolvedProgramPath + '.' + runTime

      if (await fileExists(codePath)) return { codePath, runTime }
    }
  }
  throw `The Program at (${programPath}) does not exist.`
}
