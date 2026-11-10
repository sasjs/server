import { createFile, fileExists, readFile } from '@sasjs/utils'
import { publishAppStream } from '../routes/appStream'
import { AppStreamConfig } from '../types'

import { getAppStreamConfigPath } from './file'
import {
  ID_LENGTHS,
  appIdFor,
  isAppId,
  normaliseAppLoc
} from './appStreamIdentity'

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

  process.logger.info(
    `App Stream Config loaded: ${Object.keys(process.appStreamConfig).length} app(s) registered.`
  )
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

  let parsed: unknown

  try {
    parsed = JSON.parse(await readFile(appStreamConfigPath))
  } catch (error) {
    // A registry that cannot be parsed used to be swallowed, which presented as
    // "no apps" rather than "the file is not JSON" - the two need different
    // fixes, so the difference is logged.
    process.logger?.error?.(
      `App Stream config at ${appStreamConfigPath} could not be read as JSON, so no apps are registered: ${
        (error as Error)?.message ?? error
      }`
    )

    return {}
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    process.logger?.error?.(
      `App Stream config at ${appStreamConfigPath} is not an object of app entries, so no apps are registered. Expected an object keyed by stream name, each entry ${EXPECTED_ENTRY}.`
    )

    return {}
  }

  // Entries are judged one at a time: a single bad entry used to reject the whole
  // file, so one typo unregistered every app on the server and said nothing.
  const config: AppStreamConfig = {}

  for (const [streamServiceName, entry] of Object.entries(parsed)) {
    const reason = rejectionReason(entry)

    if (reason) {
      process.logger?.error?.(
        `App Stream config: ignoring the entry "${streamServiceName}" - ${reason}. Expected ${EXPECTED_ENTRY}; the other entries are registered.`
      )

      continue
    }

    const usable = entry as AppStreamConfig[string]

    // A malformed id used to survive: preserved on write, filtered out of the
    // taken set, so it was neither valid nor replaced. Dropping it lets the next
    // publish regenerate one from the folder.
    if (usable.id !== undefined && !isAppId(usable.id)) {
      process.logger?.error?.(
        `App Stream config: ignoring the id on "${streamServiceName}" - expected a lowercase hex id of a length a publish can mint (${ID_LENGTHS.join(', ')}); it will be regenerated on the next publish.`
      )

      delete usable.id
    }

    config[streamServiceName] = usable
  }

  return config
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
      // Ids already in use, so a fresh id cannot claim one. An entry republishing
      // under the same appLoc keeps the id it has: it is a function of the folder,
      // and the folder did not move.
      // The identity is the FOLDER, so another entry pointing at the same folder
      // is the same app and must not push this one onto a longer id. That the
      // registry currently allows two names for one folder is a v1 shape #544
      // removes; until it does, both entries answer with the same id rather than
      // one of them silently acquiring a different identity.
      const appLocKey = normaliseAppLoc(appLoc)

      const taken = Object.entries(process.appStreamConfig)
        .filter(
          ([name, entry]) =>
            name !== streamServiceName &&
            normaliseAppLoc(entry.appLoc) !== appLocKey
        )
        .map(([, entry]) => entry.id)
        .filter((id): id is string => typeof id === 'string')

      process.appStreamConfig[streamServiceName] = {
        id:
          // only when the entry still points at the same folder: a name can be
          // republished against another appLoc, and keeping the old id there would
          // give one folder two identities
          (process.appStreamConfig[streamServiceName] &&
          normaliseAppLoc(process.appStreamConfig[streamServiceName].appLoc) ===
            appLocKey
            ? process.appStreamConfig[streamServiceName].id
            : undefined) ?? appIdFor(appLoc, taken),
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

/** What a valid entry looks like, quoted in the message when one is rejected. */
const EXPECTED_ENTRY =
  '{ "appLoc": string, "streamWebFolder": string, "streamLogo"?: string, "frameAncestors"?: string | string[] }'

/**
 * Why an entry cannot be used, or undefined when it can.
 *
 * Returned as a sentence about the field rather than a boolean, because the
 * point of validating is to say WHICH entry and WHICH field: a config that is
 * accepted and then silently not registered leaves the author assuming their
 * upload failed rather than their schema.
 */
const rejectionReason = (entry: unknown): string | undefined => {
  if (typeof entry !== 'object' || entry === null || Array.isArray(entry))
    return 'the entry is not an object'

  const { appLoc, streamWebFolder, streamLogo, frameAncestors } =
    entry as Record<string, unknown>

  if (typeof appLoc !== 'string' || !appLoc.trim())
    return '"appLoc" is missing or not a non-empty string'

  if (typeof streamWebFolder !== 'string' || !streamWebFolder.trim())
    return '"streamWebFolder" is missing or not a non-empty string'

  if (streamLogo !== undefined && typeof streamLogo !== 'string')
    return '"streamLogo" is present but not a string'

  if (
    frameAncestors !== undefined &&
    typeof frameAncestors !== 'string' &&
    !(
      Array.isArray(frameAncestors) &&
      frameAncestors.every((source) => typeof source === 'string')
    )
  )
    return '"frameAncestors" is present but is not a string or a list of strings'

  return undefined
}
