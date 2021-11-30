import path from 'path'
import { getRealPath } from '@sasjs/utils'

export const apiRoot = path.join(__dirname, '..', '..')
export const codebaseRoot = path.join(apiRoot, '..')
export const sysInitCompiledPath = path.join(
  apiRoot,
  'sasjsbuild',
  'systemInitCompiled.sas'
)

export const getWebBuildFolderPath = () =>
  path.join(codebaseRoot, 'web', 'build')

export const getTmpFolderPath = () =>
  process.driveLoc ?? getRealPath(path.join(process.cwd(), 'tmp'))

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
