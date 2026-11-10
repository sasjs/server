import path from 'path'
import fs from 'fs'
import AdmZip from 'adm-zip'
import unZipper from 'unzipper'
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

export const extractJSONFromZip = async (zipFile: Express.Multer.File) => {
  let fileContent: string = ''

  const fileInZip = extractName(zipFile.originalname)
  const zip = (await createReadStream(zipFile.path)).pipe(
    unZipper.Parse({ forceStream: true })
  )

  for await (const entry of zip) {
    const fileName = entry.path as string
    // grab the first json found in .zip
    if (fileName.toUpperCase().endsWith('.JSON')) {
      fileContent = await entry.buffer()
      break
    } else {
      entry.autodrain()
    }
  }

  return fileContent
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
 * records. The deploy cap counts the DECODED bytes, so wrapping text in base64
 * costs wire size, not headroom.
 *
 * Two kinds of entry are dropped rather than deployed: the `__MACOSX/` tree and
 * `.DS_Store`, which macOS adds to an archive of a folder and which are not part
 * of the app. Nothing else is filtered - a file the deploy will not accept (a
 * name with `..` in it, say) reaches the deploy and is refused there with the
 * route's own `400`, rather than disappearing here.
 */
export const extractFileTreeFromZip = async (
  zipFile: Express.Multer.File
): Promise<FileTree> => {
  const zip = new AdmZip(await fs.promises.readFile(zipFile.path))

  const members: DeployMember[] = []
  const folders = new Map<string, FolderMember>()

  for (const entry of zip.getEntries()) {
    if (entry.isDirectory) continue

    const segments = entry.entryName
      .split('/')
      .filter((segment) => segment !== '')

    if (!segments.length || segments[0] === '__MACOSX') continue

    const name = segments.pop() as string

    if (name === '.DS_Store') continue

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
