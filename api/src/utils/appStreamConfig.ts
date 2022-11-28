import { createFile, fileExists, readFile } from '@sasjs/utils'
import { publishAppStream } from '../routes/appStream'
import { AppStreamConfig } from '../types'

import { getAppStreamConfigPath } from './file'

export const loadAppStreamConfig = async () => {
  process.appStreamConfig = {}

  if (process.env.NODE_ENV === 'test') return

  const appStreamConfigPath = getAppStreamConfigPath()

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

  for (const [streamServiceName, entry] of Object.entries(appStreamConfig)) {
    const { appLoc, streamWebFolder, streamLogo } = entry

    publishAppStream(
      appLoc,
      streamWebFolder,
      streamServiceName,
      streamLogo,
      false
    )
  }

  process.logger.info('App Stream Config loaded!')
}

export const addEntryToAppStreamConfig = (
  streamServiceName: string,
  appLoc: string,
  streamWebFolder: string,
  streamLogo?: string,
  addEntryToFile: boolean = true
) => {
  if (streamServiceName && appLoc && streamWebFolder) {
    process.appStreamConfig[streamServiceName] = {
      appLoc,
      streamWebFolder,
      streamLogo
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
  const appStreamConfigPath = getAppStreamConfigPath()

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
      const { appLoc, streamWebFolder, streamLogo } = entry as any

      return (
        typeof streamServiceName !== 'string' ||
        typeof appLoc !== 'string' ||
        typeof streamWebFolder !== 'string'
      )
    })
  }
  return false
}
