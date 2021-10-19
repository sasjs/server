import path from 'path'
import { getRealPath, generateTimestamp } from '@sasjs/utils'

export const getTmpFolderPath = () =>
  getRealPath(path.join(__dirname, '..', '..', 'tmp'))

export const getTmpFilesFolderPath = () =>
  path.join(getTmpFolderPath(), 'files')

export const getTmpLogFolderPath = () => path.join(getTmpFolderPath(), 'logs')

export const getTmpWeboutFolderPath = () =>
  path.join(getTmpFolderPath(), 'webouts')

export const getTmpSessionsFolderPath = () =>
  path.join(getTmpFolderPath(), 'sessions')

export const generateUniqueFileName = (fileName: string, extension = '') =>
  [
    fileName,
    '-',
    Math.round(Math.random() * 100000),
    '-',
    new Date().getTime(),
    extension
  ].join('')

export const addSasExtensionIfNotFound = (value: string) => {
  const extension = 'sas'
  const valueSplit = value.split('.')

  if (valueSplit.length < 2) return `.${extension}`

  const hasExt = valueSplit[valueSplit.length - 1].length === 3

  return !hasExt ? `.${extension}` : ''
}
