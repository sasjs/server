import path from 'path'
import fs from 'fs'
import { getTmpSessionsFolderPath } from '.'
import { MulterFile } from '../types/Upload'
import { listFilesInFolder } from '@sasjs/utils'

/**
 * It will create an object that maps hashed file names to the original names
 * @param files array of files to be mapped
 * @returns object
 */
export const makeFilesNamesMap = (files: MulterFile[]) => {
  if (!files) return null

  const filesNamesMap: { [key: string]: string } = {}

  for (let file of files) {
    filesNamesMap[file.filename] = file.originalname
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
  filesNamesMap: any,
  sasSessionFolder: string
): Promise<string> => {
  let uploadSasCode = ''
  let fileCount = 0
  let uploadedFilesMap: {
    fileref: string
    filepath: string
    filename: string
    count: number
  }[] = []

  const sasSessionFolderList: string[] = await listFilesInFolder(
    sasSessionFolder
  )
  sasSessionFolderList.forEach((fileName) => {
    let fileCountString = fileCount < 100 ? '0' + fileCount : fileCount
    fileCountString = fileCount < 10 ? '00' + fileCount : fileCount

    if (fileName.includes('req_file')) {
      fileCount++

      uploadedFilesMap.push({
        fileref: `_sjs${fileCountString}`,
        filepath: `${sasSessionFolder}/${fileName}`,
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
    uploadSasCode += `\n%let _WEBIN_FILENAME${uploadedMap.count}=${uploadedMap.filename};`
  }

  for (let uploadedMap of uploadedFilesMap) {
    uploadSasCode += `\n%let _WEBIN_FILEREF${uploadedMap.count}=${uploadedMap.fileref};`
  }

  for (let uploadedMap of uploadedFilesMap) {
    uploadSasCode += `\n%let _WEBIN_NAME${uploadedMap.count}=${uploadedMap.filepath};`
  }

  if (fileCount > 0) {
    uploadSasCode += `\n%let _WEBIN_NAME=&_WEBIN_NAME1;`
    uploadSasCode += `\n%let _WEBIN_FILEREF=&_WEBIN_FILEREF1;`
    uploadSasCode += `\n%let _WEBIN_FILENAME=&_WEBIN_FILENAME1;`
  }

  uploadSasCode += `\n`

  return uploadSasCode
}
