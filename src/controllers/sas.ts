import {
  readFile,
  deleteFile,
  fileExists,
  createFile,
  deleteFolder
} from '@sasjs/utils'
import path from 'path'
import { ExecutionResult, ExecutionQuery } from '../types'
import {
  getTmpFilesFolderPath,
  getTmpLogFolderPath,
  getTmpWeboutFolderPath,
  generateUniqueFileName,
  getTmpSessionPath,
  getTmpFolderPath
} from '../utils'
import { configuration } from '../../package.json'
import { promisify } from 'util'
import { execFile } from 'child_process'
import fs from 'fs'

const sasUploadPath =
  configuration.sasUploadsPath.charAt(0) === '/'
    ? configuration.sasUploadsPath.replace('/', '')
    : configuration.sasUploadsPath
const execFilePromise = promisify(execFile)
const sasUploadsDir = `../../${sasUploadPath}`

export const processSas = async (
  query: ExecutionQuery,
  otherArgs?: any
): Promise<any> => {
  const sasCodePath =
    path
      .join(getTmpFilesFolderPath(), query._program)
      .replace(new RegExp('/', 'g'), path.sep) + '.sas'

  if (!(await fileExists(sasCodePath))) {
    return Promise.reject({ error: 'SAS file does not exist.' })
  }

  const sasFile: string = sasCodePath.split(path.sep).pop() || 'default'

  const sasLogPath = path.join(
    getTmpSessionPath(otherArgs.sasSessionTmp),
    sasFile + '.log'
  )
  console.log('sasLogPath', sasLogPath)

  await createFile(sasLogPath, '')

  const sasWeboutPath = path.join(
    getTmpSessionPath(otherArgs.sasSessionTmp),
    sasFile + '.txt'
  )

  await createFile(sasWeboutPath, '')

  let sasCode = await readFile(sasCodePath)

  const vars: any = query
  Object.keys(query).forEach(
    (key: string) => (sasCode = `%let ${key}=${vars[key]};\n${sasCode}`)
  )

  sasCode = `filename _webout "${sasWeboutPath}";\n${sasCode}`

  // if no files are uploaded filesNamesMap will be undefined
  if (otherArgs && otherArgs.filesNamesMap) {
    const uploadSasCode = generateFileUploadSasCode(
      otherArgs.filesNamesMap,
      otherArgs.sasSessionTmp
    )

    //If sas code for the file is generated it will be appended to the top of sasCode
    if (uploadSasCode.length > 0) {
      sasCode = `${uploadSasCode}` + sasCode
    }
  }

  const tmpSasCodePath = path.join(
    getTmpSessionPath(otherArgs.sasSessionTmp),
    sasFile + '.sas'
  )

  await createFile(tmpSasCodePath, sasCode)

  const { stdout, stderr } = await execFilePromise(configuration.sasPath, [
    '-SYSIN',
    tmpSasCodePath,
    '-log',
    sasLogPath,
    process.platform === 'win32' ? '-nosplash' : ''
  ]).catch((err) => {
    return { stderr: err, stdout: '' }
  })

  let log = ''
  if (sasLogPath && (await fileExists(sasLogPath))) {
    log = await readFile(sasLogPath)
  }

  if (stderr) return Promise.reject({ error: stderr, log: log })

  if (await fileExists(sasWeboutPath)) {
    let webout = await readFile(sasWeboutPath)

    // Remove sas session folder
    await deleteFolder(getTmpSessionPath(otherArgs.sasSessionTmp))

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
    // Remove sas session folder
    await deleteFolder(getTmpSessionPath(otherArgs.sasSessionTmp))

    return Promise.resolve({
      log: log
    })
  }
}

/**
 * Generates the sas code that reference uploaded files in the concurrent request
 * @param filesNamesMap object that maps hashed file names and original file names
 * @param sasUploadFolder name of the folder that is created for the purpose of files in concurrent request
 * @returns generated sas code
 */
const generateFileUploadSasCode = (
  filesNamesMap: any,
  sasUploadFolder: string
): string => {
  const uploadFilesDirPath = path.join(
    __dirname,
    sasUploadsDir + '/' + sasUploadFolder
  )

  let uploadSasCode = ''
  let fileCount = 0
  let uploadedFilesMap: {
    fileref: string
    filepath: string
    filename: string
    count: number
  }[] = []

  fs.readdirSync(uploadFilesDirPath).forEach((fileName) => {
    let fileCountString = fileCount < 100 ? '0' + fileCount : fileCount
    fileCountString = fileCount < 10 ? '00' + fileCount : fileCount

    if (fileName.includes('req_file')) {
      fileCount++

      uploadedFilesMap.push({
        fileref: `_sjs${fileCountString}`,
        filepath: `${uploadFilesDirPath}/${fileName}`,
        filename: filesNamesMap[fileName],
        count: fileCount
      })
    }
  })

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

  if (fileCount > 0) {
    uploadSasCode += `\n%let _WEBIN_NAME=&_WEBIN_NAME1;`
    uploadSasCode += `\n%let _WEBIN_FILEREF=&_WEBIN_FILEREF1;`
    uploadSasCode += `\n%let _WEBIN_FILENAME=&_WEBIN_FILENAME1;`
  }

  uploadSasCode += `\n`

  return uploadSasCode
}
