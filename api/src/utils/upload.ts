import path from 'path'
import { MulterFile } from '../types/Upload'
import { listFilesInFolder, readFileBinary, isWindows } from '@sasjs/utils'

interface FilenameMapSingle {
  fieldName: string
  originalName: string
}

interface FilenamesMap {
  [key: string]: FilenameMapSingle
}

interface UploadedFiles extends FilenameMapSingle {
  fileref: string
  filepath: string
  count: number
}

/**
 * It will create an object that maps hashed file names to the original names
 * @param files array of files to be mapped
 * @returns object
 */
export const makeFilesNamesMap = (files: MulterFile[]) => {
  if (!files) return null

  const filesNamesMap: FilenamesMap = {}

  for (let file of files) {
    filesNamesMap[file.filename] = {
      fieldName: file.fieldname,
      originalName: file.originalname
    }
  }

  return filesNamesMap
}

/**
 * Generates the sas code that references uploaded files in the concurrent request
 * @param filesNamesMap object that maps hashed file names and original file names
 * @param sasUploadFolder name of the folder that is created for the purpose of files in concurrent request
 * @returns generated sas code
 */
export const generateFileUploadSasCode = async (
  filesNamesMap: FilenamesMap,
  sasSessionFolder: string
): Promise<string> => {
  let uploadSasCode = ''
  let fileCount = 0
  const uploadedFiles: UploadedFiles[] = []

  const sasSessionFolderList: string[] = await listFilesInFolder(
    sasSessionFolder
  )
  sasSessionFolderList.forEach((fileName) => {
    let fileCountString = fileCount < 100 ? '0' + fileCount : fileCount
    fileCountString = fileCount < 10 ? '00' + fileCount : fileCount

    if (fileName.includes('req_file')) {
      fileCount++

      uploadedFiles.push({
        fileref: `_sjs${fileCountString}`,
        filepath: `${sasSessionFolder}/${fileName}`,
        originalName: filesNamesMap[fileName].originalName,
        fieldName: filesNamesMap[fileName].fieldName,
        count: fileCount
      })
    }
  })

  for (const uploadedFile of uploadedFiles) {
    uploadSasCode += `\nfilename ${uploadedFile.fileref} "${uploadedFile.filepath}";`
  }

  uploadSasCode += `\n%let _WEBIN_FILE_COUNT=${fileCount};`

  for (const uploadedFile of uploadedFiles) {
    uploadSasCode += `\n%let _WEBIN_FILENAME${uploadedFile.count}=${uploadedFile.originalName};`
  }

  for (const uploadedFile of uploadedFiles) {
    uploadSasCode += `\n%let _WEBIN_FILEREF${uploadedFile.count}=${uploadedFile.fileref};`
  }

  for (const uploadedFile of uploadedFiles) {
    uploadSasCode += `\n%let _WEBIN_NAME${uploadedFile.count}=${uploadedFile.fieldName};`
  }

  if (fileCount > 0) {
    uploadSasCode += `\n%let _WEBIN_NAME=&_WEBIN_NAME1;`
    uploadSasCode += `\n%let _WEBIN_FILEREF=&_WEBIN_FILEREF1;`
    uploadSasCode += `\n%let _WEBIN_FILENAME=&_WEBIN_FILENAME1;`
  }

  uploadSasCode += `\n`

  return uploadSasCode
}

/**
 * Generates the js code that references uploaded files in the concurrent request
 * @param filesNamesMap object that maps hashed file names and original file names
 * @param sessionFolder name of the folder that is created for the purpose of files in concurrent request
 * @returns generated js code
 */
export const generateFileUploadJSCode = async (
  filesNamesMap: FilenamesMap,
  sessionFolder: string
) => {
  let uploadCode = ''
  let fileCount = 0

  const sessionFolderList: string[] = await listFilesInFolder(sessionFolder)
  sessionFolderList.forEach(async (fileName) => {
    if (fileName.includes('req_file')) {
      fileCount++
      const filePath = path.join(sessionFolder, fileName)
      uploadCode += `\nconst _WEBIN_FILEREF${fileCount} = fs.readFileSync('${
        isWindows() ? filePath.replace(/\\/g, '\\\\') : filePath
      }')`
      uploadCode += `\nconst _WEBIN_FILENAME${fileCount} = '${filesNamesMap[fileName].originalName}'`
      uploadCode += `\nconst _WEBIN_NAME${fileCount} = '${filesNamesMap[fileName].fieldName}'`
    }
  })

  if (fileCount) {
    uploadCode = `\nconst _WEBIN_FILE_COUNT = ${fileCount}` + uploadCode
  }

  return uploadCode
}
