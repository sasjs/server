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

    await publishAppStream(
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

/**
 * Registry mutations are serialised, one at a time.
 *
 * The registry is a whole-file read-modify-write: `unpublishAppStream` reads the
 * stored entries, deletes one and writes the file back, while a publish writes
 * the in-memory registry over the same file. Interleaved, the loser's change is
 * silently discarded - a publish that lands between the unpublish's read and
 * write is replaced by the pre-publish snapshot, so the entry survives in memory
 * and disappears from the file (and therefore at the next restart); the other
 * order resurrects an entry that was just unpublished.
 *
 * One queue for every mutation removes the interleaving without a lock library.
 * Reads (`loadAppStreamConfig`) are not queued: they only observe.
 */
let mutations: Promise<unknown> = Promise.resolve()

export const mutateRegistry = <T>(work: () => Promise<T>): Promise<T> => {
  // `then(work, work)`: a failed mutation must not poison the queue for the next
  const run = mutations.then(work, work)

  mutations = run.catch(() => undefined)

  return run
}

/**
 * Records an entry in the in-memory registry, and in the file when asked.
 *
 * `async` because the write is awaited: the previous version fired `createFile`
 * off and returned, so a caller could observe a publish as complete while the
 * file was still empty or half written - which is exactly what a spec doing
 * publish-then-read caught, and what a restart in that window loses. The write
 * is what makes a publish survive, so it is part of the publish.
 *
 * Queued as a whole, memory set included: see `mutateRegistry`.
 */
export const addEntryToAppStreamConfig = (
  streamServiceName: string,
  appLoc: string,
  streamWebFolder: string,
  streamLogo?: string,
  addEntryToFile: boolean = true
) =>
  mutateRegistry(async () => {
    if (streamServiceName && appLoc && streamWebFolder) {
      process.appStreamConfig[streamServiceName] = {
        appLoc,
        streamWebFolder,
        streamLogo,
        // The entry is the publish, so this is when the bundle was last
        // replaced; a republish moves it.
        publishedAt: new Date().toISOString()
      }
      if (addEntryToFile) await saveAppStreamConfig()
    }
  })

const saveAppStreamConfig = async () => {
  const appStreamConfigPath = getAppStreamConfigPath()

  try {
    await createFile(
      appStreamConfigPath,
      JSON.stringify(process.appStreamConfig, null, 2)
    )
  } catch (error) {
    // a registry that cannot be written is an entry that disappears at the next
    // restart, so it is logged rather than swallowed
    process.logger?.error?.(
      `Failed to save the App Stream config: ${(error as Error)?.message ?? error}`
    )
  }
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
