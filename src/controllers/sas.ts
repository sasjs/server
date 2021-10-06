import { readFile, deleteFile, fileExists, createFile } from '@sasjs/utils'
import path from 'path'
import { ExecutionResult, ExecutionQuery } from '../types'
import {
  getTmpFilesFolderPath,
  getTmpLogFolderPath,
  getTmpWeboutFolderPath,
  generateUniqueFileName
} from '../utils'
import { configuration } from '../../package.json'
import { promisify } from 'util'
import { execFile } from 'child_process'
const execFilePromise = promisify(execFile)

export const processSas = async (query: ExecutionQuery): Promise<any> => {
  const sasCodePath = path
    .join(getTmpFilesFolderPath(), query._program)
    .replace(new RegExp('/', 'g'), path.sep)

  if (!(await fileExists(sasCodePath))) {
    return Promise.reject({ error: 'SAS file does not exist.' })
  }

  const sasFile: string = sasCodePath.split(path.sep).pop() || 'default'

  const sasLogPath = path.join(
    getTmpLogFolderPath(),
    generateUniqueFileName(sasFile.replace(/\.sas/g, ''), '.log')
  )

  const sasWeboutPath = path.join(
    getTmpWeboutFolderPath(),
    generateUniqueFileName(sasFile.replace(/\.sas/g, ''), '.json')
  )

  let sasCode = await readFile(sasCodePath)

  const vars: any = query
  Object.keys(query).forEach(
    (key: string) => (sasCode = `%let ${key}=${vars[key]};\n${sasCode}`)
  )

  sasCode = `filename _webout "${sasWeboutPath}";\n${sasCode}`

  const tmpSasCodePath = sasCodePath.replace(
    sasFile,
    generateUniqueFileName(sasFile)
  )

  await createFile(tmpSasCodePath, sasCode)

  const { stdout, stderr } = await execFilePromise(configuration.sasPath, [
    '-SYSIN',
    tmpSasCodePath,
    '-log',
    sasLogPath,
    process.platform === 'win32' ? '-nosplash' : ''
  ]).catch((err) => ({ stderr: err, stdout: '' }))

  let log = ''
  if (sasLogPath && (await fileExists(sasLogPath))) {
    log = await readFile(sasLogPath)
  }

  await deleteFile(sasLogPath)
  await deleteFile(tmpSasCodePath)

  if (stderr) return Promise.reject({ error: stderr, log: log })

  if (await fileExists(sasWeboutPath)) {
    let webout = await readFile(sasWeboutPath)

    await deleteFile(sasWeboutPath)

    const debug = Object.keys(query).find(
      (key: string) => key.toLowerCase() === '_debug'
    )

    if (debug && (query as any)[debug] >= 131) {
      webout = `<html><body>
${webout}
<div style="text-align:left">
<hr /><h2>SAS Log</h2>
<pre>${log}</pre>
</div>
</body></html>`
    }

    return Promise.resolve(webout)
  } else {
    return Promise.resolve({
      log: log
    })
  }
}
