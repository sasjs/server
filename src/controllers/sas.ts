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

  const logArgs = []
  let sasLogPath

  if (query._debug) {
    sasLogPath = path.join(
      getTmpLogFolderPath(),
      [sasFile.replace(/\.sas/g, ''), '-', generateTimestamp(), '.log'].join('')
    )
    logArgs.push('-log')
    logArgs.push(sasLogPath)
  }

  const sasWeboutPath = path.join(
    getTmpWeboutFolderPath(),
    [sasFile.replace(/\.sas/g, ''), '-', generateTimestamp(), '.json'].join('')
  )

  let sasCode = await readFile(sasCodePath)
  const originalSasCode = sasCode

  if (query.macroVars) {
    const macroVars = query.macroVars.macroVars

    Object.keys(macroVars).forEach(
      (key: string) => (sasCode = `%let ${key}=${macroVars[key]};\n${sasCode}`)
    )
  }

  sasCode = `filename _webout "${sasWeboutPath}";\n${sasCode}`

  await createFile(sasCodePath, sasCode)

  const { stdout, stderr } = await execFilePromise(configuration.sasPath, [
    '-SYSIN',
    sasCodePath,
    ...logArgs,
    '-nosplash'
  ])

  if (stderr) return Promise.reject(stderr)

  if (await fileExists(sasWeboutPath)) {
    const webout = await readFile(sasWeboutPath)

    try {
      const weboutJson = JSON.parse(webout)

      if (sasLogPath && (await fileExists(sasLogPath))) {
        return Promise.resolve({
          webout: weboutJson,
          log: await readFile(sasLogPath),
          logPath: sasLogPath
        })
      } else {
        return Promise.resolve({
          webout: weboutJson
        })
      }
    } catch (error) {
      return Promise.reject(`Error while parsing Webout. Details: ${error}`)
    }
  } else {
    return Promise.reject(`Webout wasn't created.`)
  }

  // await createFile(sasCodePath, originalSasCode)
  // await deleteFile(sasLogPath)
}
