import path from 'path'
import { fileExists } from '@sasjs/utils'
import { getFilesFolder } from './file'
import { RunTimeType } from '.'

export const getRunTimeAndFilePath = async (programPath: string) => {
  const ext = path.extname(programPath)
  // if program path is provided with extension we should split that into code path and ext as run time
  if (ext) {
    const runTime = ext.slice(1)
    const runTimeTypes = Object.values(RunTimeType)

    if (!runTimeTypes.includes(runTime as RunTimeType)) {
      throw `The '${runTime}' runtime is not supported.`
    }

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
