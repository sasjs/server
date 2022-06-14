import path from 'path'
import { fileExists } from '@sasjs/utils'
import { getFilesFolder } from './file'

export const getRunTimeAndFilePath = async (programPath: string) => {
  for (const runTime of process.runTimes) {
    const codePath =
      path
        .join(getFilesFolder(), programPath)
        .replace(new RegExp('/', 'g'), path.sep) +
      '.' +
      runTime

    if (await fileExists(codePath)) return { codePath, runTime }
  }

  throw `The Program at (${programPath}) does not exist.`
}
