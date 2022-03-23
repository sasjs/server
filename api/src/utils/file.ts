import path from 'path'

export const apiRoot = path.join(__dirname, '..', '..')
export const codebaseRoot = path.join(apiRoot, '..')
export const sysInitCompiledPath = path.join(
  apiRoot,
  'sasjsbuild',
  'systemInitCompiled.sas'
)

export const sasJSCoreMacros = path.join(apiRoot, 'sasjscore')

export const getWebBuildFolderPath = () =>
  path.join(codebaseRoot, 'web', 'build')

export const getTmpFolderPath = () => process.driveLoc

export const getTmpAppStreamConfigPath = () =>
  path.join(getTmpFolderPath(), 'appStreamConfig.json')

export const getTmpMacrosPath = () => path.join(getTmpFolderPath(), 'sasjscore')

export const getTmpUploadsPath = () => path.join(getTmpFolderPath(), 'uploads')

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
