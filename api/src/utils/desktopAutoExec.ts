import { createFile, readFile } from '@sasjs/utils'
import { getDesktopUserAutoExecPath } from './file'

export const getUserAutoExec = async (): Promise<string> =>
  readFile(getDesktopUserAutoExecPath())

export const updateUserAutoExec = async (autoExecContent: string) =>
  createFile(getDesktopUserAutoExecPath(), autoExecContent)
