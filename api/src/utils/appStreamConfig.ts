import { createFile, fileExists, readFile } from '@sasjs/utils'
import {
  createAppStreamService,
  createDriveService,
  isAppId,
  type AppStreamEntry,
  type AppStreamService,
  type AppStreamStore,
  type DriveService
} from '@sasjs/api'

import type { RouteRules } from './routeAccess'

import { getAppStreamConfigPath } from './file'
import { nodeDriveStore } from '../controllers/internal/nodeDriveStore'
import { APP_STREAM_PREFIX } from './routePrefixes'

/**
 * The index of published apps, as this host stores it.
 *
 * The package owns the shape and every rule about it - what a publish must say,
 * when an id is minted and when it is kept, what a listing is ordered by - and
 * this file owns only the bytes: the JSON file beside the drive that the server
 * has always kept its app registry in.
 *
 * That split is the point. `appStreamConfig.json` used to be a map keyed by the
 * deployer's chosen name, which made the name the registry key, the URL segment,
 * the permission path and the tile label at once - so renaming an app moved its
 * URL, and two folders could not share a readable name. The entry is now a list
 * of apps identified by a UUID, and the file is a list rather than a map. The
 * path is unchanged, so nothing else about a deployment's layout moves.
 *
 * **No migration.** Per the decision that the server is the only consumer of
 * this file, a registry written by an older build is not rewritten on read: an
 * entry without a valid id is dropped, and the deploy that published it registers
 * it again with an id the next time it runs. What is not acceptable is dropping
 * it silently, so each dropped entry is logged by name.
 */

/** The shape this host will hand to the package, entry by entry. */
const isEntry = (value: unknown): value is AppStreamEntry => {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    return false

  const entry = value as Record<string, unknown>

  return (
    isAppId(entry.id) &&
    typeof entry.name === 'string' &&
    typeof entry.appLoc === 'string' &&
    typeof entry.streamWebFolder === 'string' &&
    typeof entry.publishedAt === 'string'
  )
}

/**
 * What is on disk: the durable record of what has been published.
 *
 * Answers `[]` rather than throwing for a file that is missing - a server that
 * has never published an app is the ordinary state - and for a file that cannot
 * be used. A registry that is not JSON, or is the object an older build wrote, is
 * a fault a person needs to see in the log rather than a 500 on every request
 * that lists apps.
 */
export const readStoredAppStreamEntries = async (): Promise<
  AppStreamEntry[]
> => {
  const indexPath = getAppStreamConfigPath()

  if (!(await fileExists(indexPath))) return []

  let parsed: unknown

  try {
    parsed = JSON.parse(await readFile(indexPath))
  } catch (error) {
    process.logger?.error?.(
      `The App Stream index at ${indexPath} could not be read as JSON, so no apps are registered: ${
        (error as Error)?.message ?? error
      }`
    )

    return []
  }

  // An object is the shape before apps had an id: keyed by the chosen name, with
  // no id in the entry. Its entries cannot be indexed by id without inventing
  // one, and inventing one here would rewrite the file on a read - so the file is
  // reported and left alone. Publishing the app again registers it.
  if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
    process.logger?.error?.(
      `The App Stream index at ${indexPath} is keyed by name, which is the shape before apps were indexed by id. Its ${
        Object.keys(parsed).length
      } app(s) are not registered; redeploy each app to register it under a new id. No file was changed.`
    )

    return []
  }

  if (!Array.isArray(parsed)) {
    process.logger?.error?.(
      `The App Stream index at ${indexPath} is not a list of apps, so no apps are registered.`
    )

    return []
  }

  const entries: AppStreamEntry[] = []

  for (const candidate of parsed) {
    if (isEntry(candidate)) {
      entries.push(candidate)

      continue
    }

    // Named rather than counted: the point of validating is to say which entry,
    // so the deploy that wrote it can be looked at.
    const named =
      typeof (candidate as { name?: unknown })?.name === 'string'
        ? `"${(candidate as { name: string }).name}"`
        : 'an entry with no name'

    process.logger?.error?.(
      `The App Stream index at ${indexPath} holds ${named} without a valid id, so it is not registered. Redeploy the app to register it under a new id.`
    )
  }

  return entries
}

/** Writes the index as stored, replacing the file. */
export const writeStoredAppStreamEntries = async (
  entries: AppStreamEntry[]
): Promise<void> => {
  await createFile(getAppStreamConfigPath(), JSON.stringify(entries, null, 2))
}

/**
 * The index as the package's `AppStreamStore`: a whole-list read and a
 * whole-list write, because the index is small and this host has a file.
 *
 * Mutations are serialised by the package's service, so this only has to be
 * atomic for one call - which a single `createFile` is: it writes a temporary
 * file and renames it into place.
 */
export const fileAppStreamStore = (): AppStreamStore => ({
  read: readStoredAppStreamEntries,
  write: writeStoredAppStreamEntries
})

/**
 * The drive the surface serves an app's files from.
 *
 * Built on first use rather than at import time, the way the drive controller
 * builds its own: this module sits in the cycle through the utils barrel, and an
 * import order that evaluates it before the store exists would capture an
 * unresolved binding.
 */
let drive: DriveService | undefined

export const appStreamDrive = (): DriveService =>
  (drive ??= createDriveService(nodeDriveStore()))

let service: AppStreamService | undefined

/**
 * The index, over the file.
 *
 * One instance for the process: the package serialises mutations on it, and two
 * instances over one file would interleave their read-modify-writes exactly as
 * two processes would.
 */
export const appStreamService = (): AppStreamService =>
  (service ??= createAppStreamService(fileAppStreamStore()))

/**
 * The ids of every published app, for the route inventory.
 *
 * The permission gate is synchronous - it runs as middleware on every request,
 * including every asset an app loads - and the inventory it compares against is
 * a list of paths. So the ids are read once at boot and after every publish or
 * unpublish, rather than per request: an app's id does not change while the
 * process is running.
 */
let knownApps: AppStreamEntry[] = []

export const appStreamIds = (): string[] => knownApps.map((entry) => entry.id)

/** The published apps as last read, for a caller that must not hit the file. */
export const appStreamEntries = (): AppStreamEntry[] => knownApps

/**
 * Reads the index, and takes the apps the inventory and the gate decide on.
 *
 * Answers the entries as well, so a caller that needs both - boot, which logs
 * what it found - does not read the file twice.
 */
export const refreshAppStreamIndex = async (): Promise<AppStreamEntry[]> => {
  knownApps = await appStreamService().list()

  return knownApps
}

/**
 * The permission paths that admit one app.
 *
 * An app is granted on the id, which is its identity and what its URL carries.
 * The label is also honoured, and that is a deliberate fallback rather than an
 * oversight: every rule written before apps had an id names
 * `/AppStream/<name>`, and those rules would otherwise stop granting the app
 * they were written for. A label is not unique, so the fallback admits the app
 * carrying it - which is the app the rule named when it was written, and the
 * only one it could have meant.
 *
 * Both spellings are the canonical `/AppStream/...`: the gate canonicalises the
 * REQUEST before it looks a rule up, and rules are stored in the canonical
 * vocabulary, so a short-spelled rule is not a second thing to match here.
 */
export const appGrantPaths = (entry: AppStreamEntry): string[] => [
  `${APP_STREAM_PREFIX}/${entry.id}`,
  `${APP_STREAM_PREFIX}/${entry.name}`
]

/**
 * Which of an app's permission paths decides whether a caller may open it.
 *
 * The id decides whenever any rule speaks about it, so a deny on an app is not
 * defeated by a label rule or by a stream-wide grant. Only when no rule names
 * the id does the label decide, which is what keeps a rule written before apps
 * had an id granting the app it was written for.
 *
 * Returned rather than answered here so the reasoning is assertable on its own:
 * the caller composes it with `isRouteGranted`, the one implementation of the
 * rule order that the gate and the interface share.
 */
export const appDecidingPath = (
  entry: AppStreamEntry,
  rules: RouteRules
): string => {
  const paths = appGrantPaths(entry)

  const spoken = (candidate: string) =>
    [...rules.user, ...rules.group].some((rule) => rule.path === candidate)

  return paths.find(spoken) ?? paths[0]
}

/** The one segment an app's route carries, or undefined when there is none. */
const appSegment = (route: string): string | undefined => {
  const match = /^\/AppStream\/([^/]+)\/?$/.exec(route.split(/[?#]/)[0] ?? '')

  return match ? decodeURIComponent(match[1]) : undefined
}

/**
 * The app a route names, when one does.
 *
 * By id, or - as the surface itself is courteous enough to do - by a label only
 * one app carries. A request on `/app/<label>` reaches the gate canonicalised to
 * `/AppStream/<label>`, and the app it opens is the one the surface would open,
 * so the gate has to resolve it the same way or it would refuse access to a page
 * the surface is willing to serve.
 *
 * Reads what was cached at boot or after the last publish, because the gate is
 * synchronous middleware that also runs for every asset a page loads.
 */
export const appEntryForPath = (route: string): AppStreamEntry | undefined => {
  const segment = appSegment(route)

  if (segment === undefined) return undefined

  const byId = knownApps.find((entry) => entry.id === segment)

  if (byId) return byId

  const byLabel = knownApps.filter((entry) => entry.name === segment)

  return byLabel.length === 1 ? byLabel[0] : undefined
}
