import path from 'path'
import { getRealPath, generateTimestamp } from '@sasjs/utils'

export const getTmpFolderPath = () =>
  getRealPath(path.join(__dirname, '..', '..', 'tmp'))

export const getTmpFilesFolderPath = () =>
  path.join(getTmpFolderPath(), 'files')

export const getTmpLogFolderPath = () => path.join(getTmpFolderPath(), 'logs')

export const getTmpWeboutFolderPath = () =>
  path.join(getTmpFolderPath(), 'webouts')

export const generateUniqueFileName = (fileName: string, extension = '') =>
  [
    fileName,
    '-',
    Math.round(Math.random() * 100000),
    '-',
    generateTimestamp(),
    extension
  ].join('')