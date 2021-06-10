import { execFile } from 'child_process'
import { readFile, generateTimestamp, deleteFile } from '@sasjs/utils'
import path from 'path'
import { ExecutionResult, RequestQuery } from '../types'

// FIXME
const sasExePath = `C:\\Program Files\\SASHome\\SASFoundation\\9.4\\sas.exe`
const baseSasLogPath = 'C:\\Users\\YuryShkoda\\projects\\server\\sas\\logs'
const baseSasCodePath = `sas`

// TODO: create utils isSasFile

export const processSas = async (
  query: RequestQuery
): Promise<ExecutionResult> =>
  new Promise((resolve, reject) => {
    let sasCodePath = query._program
    sasCodePath = path.join(baseSasCodePath, `${sasCodePath}.sas`)
    sasCodePath = sasCodePath.replace(new RegExp('/', 'g'), path.sep)

    const sasFile: string = sasCodePath.split(path.sep).pop() || 'default'

    const sasLogPath = [
      baseSasLogPath,
      path.sep,
      sasFile.replace(/\.sas/g, ''),
      '-',
      generateTimestamp(),
      '.log'
    ].join('')

    execFile(
      sasExePath,
      ['-SYSIN', sasCodePath, '-log', sasLogPath, '-nosplash'],
      async (err, _, stderr) => {
        if (err) reject(err)
        if (stderr) reject(stderr)

        const log = await readFile(sasLogPath)

        deleteFile(sasLogPath)

        resolve({ log: log, logPath: sasLogPath })
      }
    )
  })
