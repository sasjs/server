import path from 'path'
import { fileExists } from '@sasjs/utils'
import { getFilesFolder } from './file'
import { RunTimeType } from '.'

export const getRunTimeAndFilePath = async (programPath: string) => {
  const ext = path.extname(programPath)
  // If programPath (_program) is provided with a ".sas" or ".js" extension 
  // we should use that extension to determine the appropriate runTime
  if (ext && Object.values(RunTimeType).includes(ext.slice(1) as RunTimeType)) {
    const runTime = ext.slice(1)

    const codePath = path
      .join(getFilesFolder(), programPath)
      .replace(new RegExp('/', 'g'), path.sep)

    if (await fileExists(codePath)) {
      return { codePath, runTime: runTime as RunTimeType }
    }
  } else {
    for (const runTime of process.runTimes) {
      const codePath =
        path
          .join(getFilesFolder(), programPath)
          .replace(new RegExp('/', 'g'), path.sep) +
        '.' +
        runTime

      if (await fileExists(codePath)) return { codePath, runTime }
    }
  }
  throw `The Program at (${programPath}) does not exist.`
}
