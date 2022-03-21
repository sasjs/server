import { createFile, fileExists, readFile } from '@sasjs/utils'
import { publishAppStream } from '../routes/appStream'
import { AppStreamConfig } from '../types'

import { getTmpAppStreamConfigPath } from './file'

export const loadAppStreamConfig = async () => {
  const appStreamConfigPath = getTmpAppStreamConfigPath()

  const content = (await fileExists(appStreamConfigPath))
    ? await readFile(appStreamConfigPath)
    : '{}'

  let appStreamConfig: AppStreamConfig
  try {
    appStreamConfig = JSON.parse(content)

    if (!isValidAppStreamConfig(appStreamConfig)) throw 'invalid type'
  } catch (_) {
    appStreamConfig = {}
  }
  process.appStreamConfig = {}

  for (const [streamServiceName, entry] of Object.entries(appStreamConfig)) {
    const { appLoc, streamWebFolder } = entry

    publishAppStream(appLoc, streamWebFolder, streamServiceName, false)
  }

  console.log('App Stream Config loaded!')
}

export const addEntryToAppStreamConfig = (
  streamServiceName: string,
  appLoc: string,
  streamWebFolder: string,
  logo?: string,
  addEntryToFile: boolean = true
) => {
  if (streamServiceName && appLoc && streamWebFolder) {
    process.appStreamConfig[streamServiceName] = {
      appLoc,
      streamWebFolder,
      logo
    }
    if (addEntryToFile) saveAppStreamConfig()
  }
}

export const removeEntryFromAppStreamConfig = (streamServiceName: string) => {
  if (streamServiceName) {
    delete process.appStreamConfig[streamServiceName]
    saveAppStreamConfig()
  }
}

const saveAppStreamConfig = async () => {
  const appStreamConfigPath = getTmpAppStreamConfigPath()

  try {
    await createFile(
      appStreamConfigPath,
      JSON.stringify(process.appStreamConfig, null, 2)
    )
  } catch (_) {}
}

const isValidAppStreamConfig = (config: any) => {
  if (config) {
    return !Object.entries(config).some(([streamServiceName, entry]) => {
      const { appLoc, streamWebFolder, logo } = entry as any

      return (
        typeof streamServiceName !== 'string' ||
        typeof appLoc !== 'string' ||
        typeof streamWebFolder !== 'string'
      )
    })
  }
  return false
}
