import path from 'path'
import unZipper from 'unzipper'
import { extractName } from './extractName'
import { createReadStream } from './file'

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
