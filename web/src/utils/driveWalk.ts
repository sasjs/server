/**
 * Every file on the drive, from a folder reader.
 *
 * The API offers one way to read the drive - one folder's immediate children per
 * request - and that is deliberate: opening Studio costs one readdir of the root
 * rather than a stat and a readdir for every entry on the drive. A search of the
 * whole drive cannot work that way, so the whole list is made here, by walking:
 * breadth first, a few folders at a time, each folder asked once.
 *
 * The reader is injected rather than imported. The walk is then a function of a
 * tree and nothing else - a node script can hand it one - and this file stays
 * free of axios, which is what lets `scripts/test-drive-tree.mjs` exercise it
 * without a browser or a server.
 */
import { ROOT_PATH } from './driveTree'
import type { TreeNode } from './types'

/**
 * How many folders are read at once.
 *
 * A walk of a large drive is one request per folder; issuing them all at once
 * spends a connection per folder on the server and answers in an order nobody
 * can read. Six is enough to keep a local drive's walk in the noise of one
 * round-trip and few enough that a shared server sees a reader, not a sweep.
 */
export const WALK_CONCURRENCY = 6

/** Reads one folder's immediate children, or answers null for one it cannot. */
export type ListFolder = (folderPath: string) => Promise<TreeNode | null>

/**
 * The paths of every file under the drive root, in the order they were found.
 *
 * A folder the caller may not read - a refusal, a folder removed mid-walk - is a
 * folder whose files this search cannot offer, and nothing more: the rest of the
 * drive is still worth searching, so the refusal ends that branch rather than the
 * walk. A folder already asked is never asked again, which is what keeps a
 * symlinked folder, or a level that names its own parent, from looping.
 * Finite concurrency is rounded down to a minimum of one; non-finite values use
 * the default so a malformed limit cannot stall or launch an unbounded walk.
 */
export const walkDrivePaths = async (
  list: ListFolder,
  concurrency: number = WALK_CONCURRENCY
): Promise<string[]> => {
  const limit = Number.isFinite(concurrency)
    ? Math.max(1, Math.floor(concurrency))
    : WALK_CONCURRENCY
  const files: string[] = []
  const folders: string[] = [ROOT_PATH]
  const asked = new Set<string>([ROOT_PATH])
  let active = 0

  await new Promise<void>((resolve) => {
    const pump = (): void => {
      while (active < limit && folders.length) {
        const folder = folders.shift() as string

        active += 1

        list(folder)
          .then((node) => {
            for (const child of node?.children ?? []) {
              if (!child.isFolder) {
                files.push(child.relativePath)
                continue
              }

              if (asked.has(child.relativePath)) continue

              asked.add(child.relativePath)
              folders.push(child.relativePath)
            }
          })
          .catch(() => undefined)
          .finally(() => {
            active -= 1
            pump()
          })
      }

      // Settled once nothing is in flight and nothing is queued: `pump` is the
      // only place either can change, so this is the whole condition rather than
      // a check that has to be repeated at each exit.
      if (active === 0 && folders.length === 0) resolve()
    }

    pump()
  })

  return files
}
