import { execFile } from 'child_process'
import {
  readFile,
  generateTimestamp,
  deleteFile,
  fileExists
} from '@sasjs/utils'
import path from 'path'
import { ExecutionResult, ExecutionQuery } from '../types'
import {
  getTmpFolderPath,
  getTmpFilesFolderPath,
  getTmpLogFolderPath
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

    const sasLogPath = path.join(
      getTmpLogFolderPath(),
      [sasFile.replace(/\.sas/g, ''), '-', generateTimestamp(), '.log'].join('')
    )

    execFile(
      configuration.sasPath,
      ['-SYSIN', sasCodePath, '-log', sasLogPath, '-nosplash'],
      async (err, _, stderr) => {
        if (err) reject(err)
        if (stderr) reject(stderr)

        const log = await readFile(sasLogPath)

        // deleteFile(sasLogPath)

        resolve({ log: log, logPath: sasLogPath })
      }
    )
  })
