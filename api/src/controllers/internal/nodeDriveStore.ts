import path from 'path'
import fs from 'fs'
import { promises as fsp } from 'fs'

import type { DriveStore } from '@sasjs/api'

import { getFilesFolder } from '../../utils/file'

/**
 * The drive as the @sasjs/api storage port.
 *
 * The package owns the drive's rules - the statuses, the messages, the order of
 * the checks, whether a path climbs out of the drive - and asks the host for
 * eight operations over the bytes. This is those eight over node's fs, where
 * SASjs Drive has always lived.
 *
 * Paths arrive drive-relative and normalised (`data/x.csv`), the way the package
 * names them; the drive's own root is joined here and never appears in an
 * answer. Containment holds at the storage boundary: a path that climbs out
 * lexically is refused, and a SYMLINK is refused as well - the lexical check
 * alone would let a link stored in the drive name a target outside it, so the
 * resolved real path is compared against the real drive root before any
 * operation touches the filesystem. A caller that reaches the store directly
 * can no more escape the drive through a link than through `..`.
 */
const driveRoot = () => path.resolve(getFilesFolder())

const outsideDrive = (driveRelative: string, resolved: string): Error => {
  const error: any = new Error(`Path is outside the drive: ${driveRelative}`)
  // both spellings, because the store's errors travel to two readers: the
  // drive routes read `code`, and anything walking the chain reads `status`
  error.code = 400
  error.status = 400
  return error
}

const absolute = (driveRelative: string): string => {
  const root = driveRoot()
  // The package names paths drive-relative with a LEADING slash ('/data/x'),
  // which node would read as filesystem-absolute; stripping it makes the
  // path a child of the root, the same convention resolveWithinDrive holds.
  const relative = String(driveRelative ?? '').replace(/^\/+/, '')
  const resolved = relative ? path.resolve(root, relative) : root
  if (resolved !== root && !resolved.startsWith(root + path.sep))
    throw outsideDrive(driveRelative, resolved)
  return resolved
}

/**
 * The same containment on the REAL path: a symlink inside the drive passes the
 * lexical check, so the resolved target is compared after following links -
 * the same rule buildDirectoryLevel holds for the filetree route. A path that
 * does not exist yet is a create; its parent decides, so the check walks the
 * nearest existing ancestor.
 */
const absoluteReal = (driveRelative: string): string => {
  const resolved = absolute(driveRelative)
  const drive = driveRoot()

  // A drive that does not exist yet holds no links, and `absolute` has already
  // refused a lexical escape - so a create in a drive that has never been
  // written needs no real-path check, and realpathSync would throw ENOENT on it.
  if (!fs.existsSync(drive)) return resolved

  const root = fs.realpathSync(drive)
  let target = resolved
  while (!fs.existsSync(target)) target = path.dirname(target)
  const real = fs.realpathSync(target)
  if (real !== root && !real.startsWith(root + path.sep))
    throw outsideDrive(driveRelative, real)
  return resolved
}

/**
 * The drive-relative path resolved to the drive's real filesystem path, for a
 * host transport that streams bytes the package's service has already agreed
 * to serve. This is the store's containment - the lexical check and the
 * symlink check both hold here - so a caller cannot reach a path the service
 * would have refused.
 */
export const resolveDrivePath = (driveRelative: string): string =>
  absoluteReal(driveRelative)

/**
 * The drive as @sasjs/api's storage port.
 *
 * Every operation is node's fs behind the path boundary, with the same
 * semantics the package's MemoryDriveStore has: `remove` takes a file or a
 * folder with everything under it, `move` takes a file or a folder tree, and
 * `list` answers the immediate children of one folder.
 *
 * The port carries whole files in memory - a read answers the file's bytes,
 * a write receives them - so a request's peak hold is the file it serves,
 * bounded by multer's 100 MB upload limit on the write routes. The port's
 * own contract is bytes-in-bytes-out; a streaming host would be a store
 * change here, not a controller change.
 */
export const nodeDriveStore = (): DriveStore => ({
  async read(drivePath) {
    const bytes = await fsp.readFile(absoluteReal(drivePath))
    // The package's DriveFile carries text-or-bytes, and the route a client
    // sees depends on which: text arrives as a string, bytes as a body. A
    // file is text when the UTF-8 round trip is lossless - the same rule the
    // mock build's seed applies when it files a project file under the drive.
    const text = bytes.toString('utf8')
    if (Buffer.from(text, 'utf8').equals(bytes)) return text
    return new Uint8Array(bytes)
  },

  async write(drivePath, contents) {
    const target = absoluteReal(drivePath)
    const data =
      typeof contents === 'string' ? Buffer.from(contents, 'utf8') : contents
    await fsp.writeFile(target, data)
  },

  async exists(drivePath) {
    try {
      await fsp.access(absoluteReal(drivePath))
      return true
    } catch (error: any) {
      // only "not there" is a false answer: a permission or I/O failure is a
      // failure the caller must see, not a missing file the service would
      // then report as a 404
      if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return false
      throw error
    }
  },

  async stat(drivePath) {
    const stats = await fsp.stat(absoluteReal(drivePath))

    return {
      directory: stats.isDirectory(),
      size: stats.size,
      // ISO strings, because the package carries them to a client as JSON and
      // the drive tree states them beside each file. `birthtime` is the
      // filesystem's creation time where it has one; on a filesystem that does
      // not track it, node reports the epoch and the reader sees 1970 - which
      // is honest about the filesystem, not a date this code invented.
      modified: stats.mtime.toISOString(),
      created: stats.birthtime.toISOString()
    }
  },

  async list(drivePath) {
    const target = absoluteReal(drivePath)
    const entries = await fsp.readdir(target, { withFileTypes: true })
    const files: string[] = []
    const folders: string[] = []
    for (const entry of entries) {
      if (entry.isFile()) files.push(entry.name)
      else if (entry.isDirectory()) folders.push(entry.name)
    }
    return { files, folders }
  },

  async mkdirp(drivePath) {
    await fsp.mkdir(absoluteReal(drivePath), { recursive: true })
  },

  async remove(drivePath) {
    await fsp.rm(absoluteReal(drivePath), { recursive: true, force: true })
  },

  async move(fromPath, toPath) {
    await fsp.rename(absoluteReal(fromPath), absoluteReal(toPath))
  }
})
