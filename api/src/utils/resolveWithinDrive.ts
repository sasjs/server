import path from 'path'
import { getFilesFolder } from './file'

/**
 * Resolves a caller-supplied path against the SASjs Drive root and returns the
 * absolute path ONLY when it stays inside the drive. Returns undefined when
 * the path would escape.
 *
 * The previous containment checks across the drive controller and the
 * program-path resolver were substring tests (`resolved.includes(driveRoot)`),
 * which a sibling directory whose name shares a suffix with the drive folder
 * defeats (`/drive/files` vs `/drive/files_backup`). This helper does the
 * containment the way path traversal is actually prevented:
 *
 *   resolve, then require the drive-relative remainder to exist and to not
 *   climb out (`..`).
 *
 * Used everywhere a request can name a location under the drive: the drive
 * controller's CRUD paths, the deploy tree builder, the app-stream publisher
 * and `_program` execution.
 */
export const resolveWithinDrive = (unsafePath: string): string | undefined => {
  const root = path.resolve(getFilesFolder())

  // Windows accepts both separators and both survive path.join; normalising to
  // forward slashes keeps the relative computation honest. A LEADING slash is
  // stripped rather than honoured: sasjs program references are drive-relative
  // by convention (`_program=/my/app/services/run.sas`, appLoc starts with /),
  // so an anchored input means "under the drive root", never "filesystem
  // absolute" - honouring it here would reject every existing deployment AND
  // make `/etc/passwd` a filesystem absolute path.
  const normalised = unsafePath.replace(/\\/g, '/').replace(/^\/+/, '')

  const resolved = path.resolve(root, normalised)

  const relative = path.relative(root, resolved)

  // '' is the drive root itself - inside. A first segment of '..' means the
  // path climbs out; an absolute relative means it landed on another volume.
  // Comparing the first SEGMENT (not a string prefix) matters: a legitimate
  // file named '..foo' has relative '..foo' and must not be rejected.
  const firstSegment = relative.split(path.sep)[0]
  const inside =
    (relative === '' || firstSegment !== '..') && !path.isAbsolute(relative)

  return inside ? resolved : undefined
}

/**
 * True when `name` is a single path SEGMENT - no separators, no parent
 * references. Deployed FileTree members (and their folder levels) must be
 * single segments; anything else would let a member name climb out of the
 * destination folder it is written into.
 */
export const isSafePathSegment = (name: string): boolean => {
  return (
    typeof name === 'string' &&
    name.length > 0 &&
    !name.includes('/') &&
    !name.includes('\\') &&
    name !== '.' &&
    name !== '..'
  )
}
