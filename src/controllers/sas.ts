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
import { promisify } from 'util'
import { execFile } from 'child_process'
const execFilePromise = promisify(execFile)

export const processSas = async (
  query: ExecutionQuery
): Promise<ExecutionResult> => {
  let sasCodePath = path.join(getTmpFilesFolderPath(), query._program)
  sasCodePath = sasCodePath.replace(new RegExp('/', 'g'), path.sep)

  if (!(await fileExists(sasCodePath))) {
    return Promise.reject('SAS file does not exist.')
  }

  const sasFile: string = sasCodePath.split(path.sep).pop() || 'default'

  const sasLogPath = path.join(
    getTmpLogFolderPath(),
    [sasFile.replace(/\.sas/g, ''), '-', generateTimestamp(), '.log'].join('')
  )

  const { stdout, stderr } = await execFilePromise(configuration.sasPath, [
    '-SYSIN',
    sasCodePath,
    '-log',
    sasLogPath,
    '-nosplash'
  ])

  if (stderr) return Promise.reject(stderr)

  if (await fileExists(sasLogPath)) {
    return Promise.resolve({
      log: await readFile(sasLogPath),
      logPath: sasLogPath
    })
  } else {
    return Promise.reject(`Log file wasn't created.`)
  }

  // deleteFile(sasLogPath)
}
