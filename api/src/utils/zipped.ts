import path from 'path'
import fs from 'fs'
import AdmZip from 'adm-zip'
import unZipper from 'unzipper'
import { DEPLOY_LIMITS, APP_MANIFEST } from '@sasjs/api'
import type { DeployLimits } from '@sasjs/api'
import { MemberType } from '@sasjs/utils'
import type {
  FileMember,
  FileTree,
  FolderMember,
  ServiceMember
} from '@sasjs/utils'
import { extractName } from './extractName'
import { createReadStream } from './file'

type DeployMember = FolderMember | ServiceMember | FileMember

/**
 * A refusal an archive earns before a tree exists, in the shape the deploy
 * routes render: the status is carried in `code`, the body in the other fields.
 *
 * The wording is the deploy cap's own - `checkDeployTree` in `@sasjs/api` says
 * the same sentences for a tree that arrives as JSON, and a spec pins the two
 * against each other so an archive refused for its size reads like any other
 * refusal rather than like a new kind of failure.
 */
export class DeployRefusal extends Error {
  code: number
  status = 'failure'

  constructor(code: number, message: string) {
    super(message)

    // this module's target compiles `class ... extends Error` to ES5, where
    // `super()` answers a fresh `Error` and the instance loses this prototype -
    // so `instanceof DeployRefusal` would answer false for a refusal this file
    // threw. Putting it back is what lets a reader ask whether a failure is
    // already a refusal, and keep its status rather than wrapping it.
    Object.setPrototypeOf(this, DeployRefusal.prototype)

    this.code = code
  }
}

const MEGABYTE = 1024 * 1024

/** A measured size, rounded up to one decimal in binary megabytes. */
const describeSize = (bytes: number) =>
  bytes < MEGABYTE
    ? `${bytes} bytes`
    : `${Math.ceil((bytes / MEGABYTE) * 10) / 10} MB`

/** A limit, printed as it is stated. */
const describeLimit = (bytes: number) =>
  bytes < MEGABYTE
    ? `${bytes} bytes`
    : `${Math.round((bytes / MEGABYTE) * 10) / 10} MB`

/**
 * What a zip archive begins with: a local file, an empty archive, or a spanned
 * one. All three are four bytes long, so the opening decides by itself.
 */
const ZIP_SIGNATURES = [
  Buffer.from([0x50, 0x4b, 0x03, 0x04]),
  Buffer.from([0x50, 0x4b, 0x05, 0x06]),
  Buffer.from([0x50, 0x4b, 0x07, 0x08])
]

/** Whether the file's name says it is an archive, whatever it was typed as. */
export const isArchiveName = (name: string): boolean =>
  path.extname(name).toUpperCase() === '.ZIP'

/**
 * The opening of a file, written out as it reads.
 *
 * A refusal is only useful if it says what was FOUND, so the first bytes are
 * quoted: printable ASCII as itself, anything else as `\xNN` - a body that is not
 * an archive may be binary, and neither a browser nor a log needs control
 * characters in it.
 */
const openingBytes = (bytes: Buffer, count = 32): string => {
  const shown = bytes.subarray(0, count)

  let text = ''

  for (let at = 0; at < shown.length; at++) {
    const byte = shown[at]

    if (byte >= 0x20 && byte < 0x7f) text += String.fromCharCode(byte)
    else if (byte === 0x0a) text += '\\n'
    else if (byte === 0x0d) text += '\\r'
    else if (byte === 0x09) text += '\\t'
    else text += `\\x${byte.toString(16).padStart(2, '0')}`
  }

  return bytes.length > count ? `${text}...` : text
}

/**
 * A zip archive's opening, as a refusal quotes it.
 *
 * Quoted in full, not as `PK`: a file holding only `PK` - an archive cut off
 * before its header - would otherwise be refused with "it begins with PK, where a
 * zip begins with PK", which contradicts itself exactly where a reader needs the
 * sentence to be right.
 */
const ZIP_OPENING = openingBytes(ZIP_SIGNATURES[0])

/**
 * The signature a file stops inside, quoted, or `undefined` when it does not.
 *
 * Which one matters: `PK\x05` is the beginning of the empty-archive signature and
 * not of the local-file one, so a refusal that quoted the first signature for
 * every short file would assert a prefix relation the file does not have.
 */
const stopsInsideSignature = (bytes: Buffer): string | undefined => {
  if (!bytes.length) return undefined

  for (const signature of ZIP_SIGNATURES)
    if (
      bytes.length < signature.length &&
      signature.subarray(0, bytes.length).equals(bytes)
    )
      return openingBytes(signature)

  return undefined
}

/**
 * Why a file that is not an archive is not one, in the file's own terms.
 *
 * Three cases, because a reader needs different things from each: a file that is
 * empty, a file that stops inside a signature (`PK` alone is an archive cut off
 * before its header, not a file that begins the way an archive does), and anything
 * else, which quotes what the file does begin with.
 */
const notAnArchive = (name: string, bytes: Buffer): string => {
  if (bytes.length === 0)
    return `The file "${name}" is empty, where a zip archive begins with the four bytes "${ZIP_OPENING}".`

  const stopped = stopsInsideSignature(bytes)

  if (stopped)
    return `The file "${name}" is not a zip archive: it holds ${bytes.length} byte(s), so it ends inside "${stopped}", the four bytes a zip archive begins with.`

  return `The file "${name}" is not a zip archive: it begins with "${openingBytes(
    bytes
  )}", where a zip archive begins with the four bytes "${ZIP_OPENING}".`
}

/**
 * Reads an uploaded file as an archive, and refuses one that is not.
 *
 * `AdmZip` reports a body that is not a zip in its own terms - "ADM-ZIP: Invalid
 * CEN header (bad signature)" - which names neither the file nor what it holds,
 * and reached the client as a `500`. The first four bytes answer whether the file
 * is an archive at all, so the refusal names the file, quotes what it begins
 * with, and says what an archive begins with. A file that passes that check and
 * still cannot be read keeps the reader's reason, attached to the file's name.
 *
 * Both are `400`: the caller sent something that is not an archive, which is a
 * request to correct rather than a server that broke.
 */
const readArchive = async <T>(
  zipFile: Express.Multer.File,
  read: (zip: AdmZip) => T
): Promise<T> => {
  const bytes = await fs.promises.readFile(zipFile.path)

  if (
    !ZIP_SIGNATURES.some((signature) => bytes.subarray(0, 4).equals(signature))
  )
    throw new DeployRefusal(400, notAnArchive(zipFile.originalname, bytes))

  try {
    return read(new AdmZip(bytes))
  } catch (error) {
    if (error instanceof DeployRefusal) throw error

    throw new DeployRefusal(
      400,
      `The file "${zipFile.originalname}" could not be read as a zip archive: ${
        (error as Error)?.message ?? error
      }`
    )
  }
}

/**
 * Whether a file is an archive, as far as its name and the type it arrived with
 * say so. Both refusals name the file, for the reason below.
 *
 * Each says what was FOUND and what was expected, because that is the sentence the
 * caller can act on - `"file" has invalid type application/octet-stream` names the
 * multipart field, not the build the admin chose. Neither claims the file is not an
 * archive: the bytes have not been read here, and a `.zip` the browser typed as
 * `application/octet-stream` may be a perfectly good one. What the bytes are is
 * `readArchive`'s answer, and it says so in its own sentence.
 *
 * The deploy route renders only the TYPE refusal. A file whose name does not end
 * `.zip` is read as a deploy document rather than refused as an archive - that is
 * how the older `build.json` shape still works - so the extension sentence is for a
 * caller asking `isZipFile` about a file the route would not treat as an archive at
 * all, and it is written as a sentence for whoever asks.
 */
export const isZipFile = (
  file: Express.Multer.File
): { error?: string; value?: Express.Multer.File } => {
  const fileExtension = path.extname(file.originalname)

  if (!isArchiveName(file.originalname))
    return {
      error: `The file "${file.originalname}" was not taken as an archive: its name ends "${fileExtension}", where an archive's name ends ".zip".`
    }

  const allowedMimetypes = ['application/zip', 'application/x-zip-compressed']

  if (!allowedMimetypes.includes(file.mimetype))
    return {
      error: `The file "${file.originalname}" arrived as "${file.mimetype}", where an archive arrives as "${allowedMimetypes.join(
        '" or "'
      )}".`
    }

  return { value: file }
}

/**
 * The deploy document an archive carries, if it carries one.
 *
 * A deploy document is a JSON file at the ARCHIVE ROOT whose parsed value names
 * `appLoc` or `fileTree`. Both conditions matter:
 *
 * - Location, because an app ships its own JSON - a manifest, a config, a data
 *   file - and one of those must not be mistaken for the document. Reading the
 *   first `.json` anywhere in the archive did exactly that, and a `manifest.json`
 *   then earned the deploy validator's `400` (or, worse, was deployed as the
 *   document while every other entry was ignored).
 * - Shape, because a root-level `.json` in an app may still be an app file. A
 *   file naming EITHER key is the caller's attempt at a document, so it goes to
 *   the validator, which names whichever field is missing.
 *
 * The entry's uncompressed size is checked against the deploy cap before it is
 * read: the transport bounds the archive, not what it expands to.
 */
export const extractDeployDocumentFromZip = async (
  zipFile: Express.Multer.File,
  limits: DeployLimits = DEPLOY_LIMITS
): Promise<string | undefined> =>
  readArchive(zipFile, (zip) => {
    for (const entry of zip.getEntries()) {
      if (entry.isDirectory) continue
      if (entry.entryName.includes('/')) continue
      if (!entry.entryName.toUpperCase().endsWith('.JSON')) continue

      // `sasjs.app.json` is the bundle's own manifest, not a deploy document. It
      // names an `appLoc` too, so without this it is read as a document and then
      // refused for having no `fileTree` - the app's own metadata taking the whole
      // archive down with it.
      if (entry.entryName.toLowerCase() === APP_MANIFEST) continue

      if (entry.header.size > limits.totalBytes)
        throw new DeployRefusal(
          413,
          `The deploy document exceeds the deploy limit: ${describeSize(
            entry.header.size
          )} (maximum ${describeLimit(limits.totalBytes)}).`
        )

      let parsed: unknown

      try {
        parsed = JSON.parse(entry.getData().toString('utf8'))
      } catch (_) {
        continue
      }

      // `||`, not `&&`: a document missing one of the two is still a document,
      // and the deploy validator's own message (which names the missing field) is
      // more use than being deployed as an app file
      if (
        parsed &&
        typeof parsed === 'object' &&
        ('appLoc' in parsed || 'fileTree' in parsed)
      )
        return entry.getData().toString('utf8')
    }

    return undefined
  })

/**
 * Reads an archive of an app's files into a deploy tree.
 *
 * This is the "publish this folder" half of `POST /drive/deploy/upload`: the
 * archive carries the app itself, not a deploy document, so its entries become
 * `file` members under `appLoc` and the ordinary deploy writes them - one
 * implementation of the cap, the name checks, the containment and `replace`.
 *
 * Every member is base64, because an archive holds bytes: a `.png` and an
 * `.html` are both just entries, and text-vs-binary is not something the zip
 * records.
 *
 * **The cap is applied to the ARCHIVE'S OWN SIZE FIGURES, before anything is
 * decompressed.** `checkDeployTree` measures a tree that already exists in
 * memory; here the tree is what an uploaded archive would create, and DEFLATE
 * expands up to about 1000:1, so one 140MB upload could otherwise allocate tens
 * of gigabytes and take the process down instead of answering `413`. Each entry's
 * uncompressed size comes from the central directory, so the refusals are issued
 * without reading a byte of the file's contents.
 *
 * Two kinds of entry are dropped rather than deployed: the `__MACOSX/` tree and
 * `.DS_Store`, which macOS adds to an archive of a folder and which are not part
 * of the app. Nothing else is filtered - a file the deploy will not accept (a
 * name with `..` in it, say) reaches the deploy and is refused there.
 */
export const extractFileTreeFromZip = async (
  zipFile: Express.Multer.File,
  limits: DeployLimits = DEPLOY_LIMITS
): Promise<FileTree> =>
  readArchive(zipFile, (zip) => entriesOf(zip, zipFile.originalname, limits))

/** The tree an archive's entries describe - see `extractFileTreeFromZip`. */
const entriesOf = (
  zip: AdmZip,
  archiveName: string,
  limits: DeployLimits
): FileTree => {
  const members: DeployMember[] = []
  const folders = new Map<string, FolderMember>()

  let entries = 0
  let totalBytes = 0

  for (const entry of zip.getEntries()) {
    if (entry.isDirectory) continue

    const segments = entry.entryName
      .split('/')
      .filter((segment) => segment !== '')

    if (!segments.length || segments[0] === '__MACOSX') continue

    const name = segments.pop() as string

    if (name === '.DS_Store') continue

    // measured from the central directory, so a compressed bomb is refused
    // before its bytes are expanded
    const size = entry.header.size

    entries++

    if (entries > limits.entries)
      throw new DeployRefusal(
        413,
        `The file tree exceeds the deploy limit: ${entries} entries (maximum ${limits.entries}).`
      )

    totalBytes += size

    if (totalBytes > limits.totalBytes)
      throw new DeployRefusal(
        413,
        `The file tree exceeds the deploy limit: ${describeSize(
          totalBytes
        )} (maximum ${describeLimit(limits.totalBytes)}).`
      )

    if (size > limits.fileBytes)
      throw new DeployRefusal(
        413,
        `A file in the tree exceeds the deploy limit: ${entry.entryName} is ${describeSize(
          size
        )} (maximum ${describeLimit(limits.fileBytes)} per file).`
      )

    // the folder chain to this file, created once and reused by later entries
    let parentPath = ''
    let list = members

    for (const segment of segments) {
      const folderPath = parentPath ? `${parentPath}/${segment}` : segment
      let folder = folders.get(folderPath)

      if (!folder) {
        folder = { name: segment, type: MemberType.folder, members: [] }
        folders.set(folderPath, folder)
        list.push(folder)
      }

      list = folder.members
      parentPath = folderPath
    }

    list.push({
      name,
      type: MemberType.file,
      encoding: 'base64',
      code: entry.getData().toString('base64')
    })
  }

  // An archive with nothing deployable is refused rather than deployed: the
  // route replaces the folder by default, so an empty tree would remove a
  // published app and answer `200 Files deployed successfully` - a build that
  // produced nothing silently deleting what is live.
  if (!members.length)
    throw new DeployRefusal(
      400,
      `The archive ${archiveName} contains no files to deploy.`
    )

  return { members }
}
