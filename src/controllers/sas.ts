import { execFile } from 'child_process'
import {
  readFile,
  generateTimestamp,
  deleteFile,
  fileExists,
  createFile
} from '@sasjs/utils'
import path from 'path'
import { ExecutionResult, ExecutionQuery } from '../types'
import {
  getTmpFilesFolderPath,
  getTmpLogFolderPath,
  getTmpWeboutFolderPath
} from '../utils'
import { configuration } from '../../package.json'

export const processSas = async (
  query: ExecutionQuery
): Promise<ExecutionResult> =>
  new Promise(async (resolve, reject) => {
    let sasCodePath = path.join(getTmpFilesFolderPath(), query._program)
    sasCodePath = sasCodePath.replace(new RegExp('/', 'g'), path.sep)

    if (!(await fileExists(sasCodePath))) {
      reject('SAS file does not exist.')
    }

    const sasFile: string = sasCodePath.split(path.sep).pop() || 'default'

    const sasWeboutPath = path.join(
      getTmpWeboutFolderPath(),
      [sasFile.replace(/\.sas/g, ''), '-', generateTimestamp(), '.json'].join(
        ''
      )
    )

    let sasCode = await readFile(sasCodePath)
    const originalSasCode = sasCode

    if (query.macroVars) {
      const macroVars = query.macroVars.macroVars

      Object.keys(macroVars).forEach(
        (key: string) =>
          (sasCode = `%let ${key}=${macroVars[key]};\n${sasCode}`)
      )
    }

    sasCode = `filename _webout "${sasWeboutPath}";\n${sasCode}`

    await createFile(sasCodePath, sasCode)

    const sasLogPath = path.join(
      getTmpLogFolderPath(),
      [sasFile.replace(/\.sas/g, ''), '-', generateTimestamp(), '.log'].join('')
    )

    await createFile(sasLogPath, '')

    execFile(
      configuration.sasPath,
      ['-SYSIN', sasCodePath, '-log', sasLogPath, '-nosplash'],
      async (err, _, stderr) => {
        if (err) reject(err)
        if (stderr) reject(stderr)

        const log = await readFile(sasLogPath)

        deleteFile(sasLogPath)

        await createFile(sasCodePath, originalSasCode)

        resolve({ log: log, logPath: sasLogPath })
      }
    )
  })
