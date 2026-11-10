import path from 'path'
import fs from 'fs'
import AdmZip from 'adm-zip'
import unZipper from 'unzipper'
import { DEPLOY_LIMITS } from '@sasjs/api'
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

export const isZipFile = (
  file: Express.Multer.File
): { error?: string; value?: Express.Multer.File } => {
  const fileExtension = path.extname(file.originalname)
  if (fileExtension.toUpperCase() !== '.ZIP')
    return { error: `"file" has invalid extension ${fileExtension}` }

  const allowedMimetypes = ['application/zip', 'application/x-zip-compressed']

  if (!allowedMimetypes.includes(file.mimetype))
    return { error: `"file" has invalid type ${file.mimetype}` }

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
): Promise<string | undefined> => {
  const zip = new AdmZip(await fs.promises.readFile(zipFile.path))

  for (const entry of zip.getEntries()) {
    if (entry.isDirectory) continue
    if (entry.entryName.includes('/')) continue
    if (!entry.entryName.toUpperCase().endsWith('.JSON')) continue

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
}

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
): Promise<FileTree> => {
  const zip = new AdmZip(await fs.promises.readFile(zipFile.path))

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

  return { members }
}
