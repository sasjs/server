import { createFile, fileExists, readFile } from '@sasjs/utils'
import { publishAppStream } from '../routes/appStream'
import { AppStreamConfig } from '../types'

import { getAppStreamConfigPath } from './file'

export const loadAppStreamConfig = async () => {
  process.appStreamConfig = {}

  if (process.env.NODE_ENV === 'test') return

  const appStreamConfig = await readStoredAppStreamConfig()

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

/**
 * The registry as it is stored: the durable record of what was published.
 *
 * Not the same thing as `process.appStreamConfig`, and the difference is why
 * this is a function rather than an inline read. Boot only puts an entry into
 * memory when its deployment folder still exists (`publishAppStream` returns
 * before it records anything otherwise), so an entry whose folder was deleted
 * out from under the server is in the file and not in memory. Reading the file is
 * therefore the only way to answer "was this published?", and the only way to
 * remove such an entry, which is exactly the stale-listing case the unpublish
 * route exists for.
 */
export const readStoredAppStreamConfig = async (): Promise<AppStreamConfig> => {
  const appStreamConfigPath = getAppStreamConfigPath()

  if (!(await fileExists(appStreamConfigPath))) return {}

  try {
    const content = await readFile(appStreamConfigPath)
    const parsed = JSON.parse(content)

    return isValidAppStreamConfig(parsed) ? parsed : {}
  } catch (_) {
    return {}
  }
}

/** Writes the registry as stored, replacing the file. */
export const writeStoredAppStreamConfig = async (config: AppStreamConfig) => {
  await createFile(getAppStreamConfigPath(), JSON.stringify(config, null, 2))
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

/**
 * Removes an entry from the in-memory registry and writes that view to the file.
 *
 * Only correct for an entry that is IN memory: the write replaces the file with
 * `process.appStreamConfig`, so an entry that boot dropped because its deployment
 * folder had gone is purged by the same write. Unpublishing therefore edits the
 * stored registry directly (`unpublishAppStream` in routes/appStream) instead of
 * calling this.
 */
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
