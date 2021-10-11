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
import fs from 'fs'

const execFilePromise = promisify(execFile)
const sasUploadsDir = '../../sas_uploads'

export const processSas = async (query: ExecutionQuery, otherArgs?: any): Promise<any> => {
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

  await createFile(sasLogPath, '')

  const sasWeboutPath = path.join(
    getTmpWeboutFolderPath(),
    generateUniqueFileName(sasFile.replace(/\.sas/g, ''), '.txt')
  )

  await createFile(sasWeboutPath, '')

  let sasCode = await readFile(sasCodePath)

  const vars: any = query
  Object.keys(query).forEach(
    (key: string) => (sasCode = `%let ${key}=${vars[key]};\n${sasCode}`)
  )

  sasCode = `filename _webout "${sasWeboutPath}";\n${sasCode}`

  if (otherArgs && otherArgs.filesNamesMap) {
    const uploadSasCode = parseFileUploadSasCode(otherArgs.filesNamesMap)

    if (uploadSasCode.length > 0) {
      sasCode += `${uploadSasCode}`
    }
  }

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

  //remove uploaded files
  const sasUploadsDirPath = path.join(__dirname, '../../sas_uploads')
  fs.readdirSync(sasUploadsDirPath).forEach(async fileName => {
    await deleteFile(sasUploadsDirPath + '/' + fileName)
  })

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

const parseFileUploadSasCode = (filesNamesMap: any) => {
  const uploadFilesDirPath = path.join(__dirname, sasUploadsDir)

  let uploadSasCode = ''
  let fileCount = 0
  let uploadedFilesMap: {fileref: string, filepath: string, filename: string, count: number}[] = []

  fs.readdirSync(uploadFilesDirPath).forEach(fileName => {
    fileCount++

    let fileCountString = fileCount < 100 ? '0' + fileCount : fileCount
    fileCountString = fileCount < 10 ? '00' + fileCount : fileCount

    uploadedFilesMap.push({
      fileref: `_sjs${fileCountString}`,
      filepath: `${uploadFilesDirPath}/${fileName}`,
      filename: filesNamesMap[fileName],
      count: fileCount
    })
  });

  for (let uploadedMap of uploadedFilesMap) {
    uploadSasCode += `\nfilename ${uploadedMap.fileref} "${uploadedMap.filepath}";`
  }

  uploadSasCode += `\n%let _WEBIN_FILE_COUNT=${fileCount};`

  for (let uploadedMap of uploadedFilesMap) {
    uploadSasCode += `\n%let _WEBIN_FILENAME${uploadedMap.count}=${uploadedMap.filepath};`
  }

  for (let uploadedMap of uploadedFilesMap) {
    uploadSasCode += `\n%let _WEBIN_FILEREF${uploadedMap.count}=${uploadedMap.fileref};`
  }

  for (let uploadedMap of uploadedFilesMap) {
    uploadSasCode += `\n%let _WEBIN_NAME${uploadedMap.count}=${uploadedMap.filename};`
  }

  return uploadSasCode
}