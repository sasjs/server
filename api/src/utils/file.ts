import path from 'path'
import { homedir } from 'os'
import fs from 'fs-extra'

export const apiRoot = path.join(__dirname, '..', '..')
export const codebaseRoot = path.join(apiRoot, '..')
export const sysInitCompiledPath = path.join(
  apiRoot,
  'sasjsbuild',
  'systemInitCompiled.sas'
)

export const sasJSCoreMacros = path.join(apiRoot, 'sas', 'sasautos')
export const sasJSCoreMacrosInfo = path.join(sasJSCoreMacros, '.macrolist')

export const getWebBuildFolder = () => path.join(codebaseRoot, 'web', 'build')

export const getSasjsHomeFolder = () => path.join(homedir(), '.sasjs-server')

export const getDesktopUserAutoExecPath = () =>
  path.join(getSasjsHomeFolder(), 'user-autoexec.sas')

export const getSasjsRootFolder = () => process.sasjsRoot

export const getSasjsDriveFolder = () => process.driveLoc

export const getLogFolder = () => process.logsLoc

export const getAppStreamConfigPath = () =>
  path.join(getSasjsDriveFolder(), 'appStreamConfig.json')

export const getMacrosFolder = () =>
  path.join(getSasjsDriveFolder(), 'sas', 'sasautos')

export const getPackagesFolder = () =>
  path.join(getSasjsDriveFolder(), 'sas', 'sas_packages')

export const getUploadsFolder = () => path.join(getSasjsRootFolder(), 'uploads')

export const getFilesFolder = () => path.join(getSasjsDriveFolder(), 'files')

export const getWeboutFolder = () => path.join(getSasjsRootFolder(), 'webouts')

export const getSessionsFolder = () =>
  path.join(getSasjsRootFolder(), 'sessions')

export const generateUniqueFileName = (fileName: string, extension = '') =>
  [
    fileName,
    '-',
    Math.round(Math.random() * 100000),
    '-',
    new Date().getTime(),
    extension
  ].join('')

export const createReadStream = async (filePath: string) =>
  fs.createReadStream(filePath)
