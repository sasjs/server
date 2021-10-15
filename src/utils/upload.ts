import path from 'path'
import fs from 'fs'
import { getTmpSessionsFolderPath } from '.'

/**
 * It will create a object that maps hashed file names to the original names
 * @param files array of files to be mapped
 * @returns object
 */
export const makeFilesNamesMap = (files: any) => {
  if (!files) return null

  const filesNamesMap: any = {}

  for (let file of files) {
    filesNamesMap[file.filename] = file.fieldname
  }

  return filesNamesMap
}

/**
 * Generates the sas code that reference uploaded files in the concurrent request
 * @param filesNamesMap object that maps hashed file names and original file names
 * @param sasUploadFolder name of the folder that is created for the purpose of files in concurrent request
 * @returns generated sas code
 */
export const generateFileUploadSasCode = (
  filesNamesMap: any,
  sasSessionFolder: string
): string => {
  const uploadFilesDirPath = sasSessionFolder

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
