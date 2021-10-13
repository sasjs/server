import path from 'path'
import { getRealPath, generateTimestamp } from '@sasjs/utils'
import { configuration } from '../../package.json'

const sasSessionTmpPath =
  configuration.sasUploadsPath.charAt(0) === '/'
    ? configuration.sasUploadsPath.replace('/', '')
    : configuration.sasUploadsPath

export const getTmpSessionPath = (sessionFolder?: string) =>
  getRealPath(
    path.join(
      __dirname,
      '..',
      '..',
      sasSessionTmpPath,
      sessionFolder ? sessionFolder : ''
    )
  )

export const getTmpFolderPath = () =>
  getRealPath(path.join(__dirname, '..', '..', 'tmp'))

export const getTmpFilesFolderPath = (sessionFolder?: string) => {
  if (!sessionFolder) return path.join(getTmpFolderPath(), 'files')

  return path.join(getTmpSessionPath(sessionFolder), 'files')
}

export const getTmpLogFolderPath = (sessionFolder?: string) => {
  if (!sessionFolder) path.join(getTmpLogFolderPath(), 'logs')

  return path.join(getTmpSessionPath(sessionFolder), 'logs')
}

export const getTmpWeboutFolderPath = (sessionFolder?: string) => {
  if (!sessionFolder) return path.join(getTmpFolderPath(), 'webouts')

  return path.join(getTmpSessionPath(sessionFolder), 'webouts')
}

export const generateUniqueFileName = (fileName: string, extension = '') =>
  [
    fileName,
    '-',
    Math.round(Math.random() * 100000),
    '-',
    generateTimestamp(),
    extension
  ].join('')
