import { createFolder } from '@sasjs/utils'
import { getFilesFolder, getPackagesFolder } from './file'

export const setupFilesFolder = async () => 
  await createFolder(getFilesFolder())

export const setupPackagesFolder = async () =>
  await createFolder(getPackagesFolder())

