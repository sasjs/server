/**
 * The extensions the Studio shows as a picture rather than in the editor.
 *
 * These are the formats a browser renders in an `<img>` with no plugin, so a
 * clicked file can be handed straight to one. An SVG counts: it is an image to
 * the reader, and inside `<img>` its scripts do not run.
 */
export const IMAGE_EXTENSIONS = [
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'bmp',
  'ico',
  'avif',
  'svg'
]

/**
 * Whether a drive path is a picture, judged by its extension.
 *
 * A path with no extension, or a directory whose name contains a dot, is not an
 * image: `split('.').pop()` returns the whole segment in the first case, and the
 * extension of the last segment in the second, which is what is wanted either way.
 */
export const isImageFile = (filePath: string) => {
  const extension = filePath.split('.').pop()?.toLowerCase() ?? ''

  return IMAGE_EXTENSIONS.includes(extension)
}

/**
 * What a drive entry is, as far as the tree's icon column is concerned.
 *
 * `image` is not listed by extension here: the previewable formats are
 * `IMAGE_EXTENSIONS`, so the two cannot drift.
 */
export type DriveFileKind =
  'program' | 'data' | 'log' | 'config' | 'table' | 'image'

/** The extensions behind every kind but `image`, which reuses the image list. */
const EXTENSIONS_BY_KIND: {
  [kind in Exclude<DriveFileKind, 'image'>]: string[]
} = {
  program: ['sas'],
  data: ['sas7bdat', 'sas7bcat'],
  log: ['log'],
  // `.sasjslint` is the drive's own rules file, and JSON like the rest
  config: ['json', 'sasjslint'],
  table: ['csv', 'xls', 'xlsx']
}

/**
 * Which icon a drive path gets, or `null` for one it has none of its own.
 *
 * Judged by the last segment's extension, the same way `isImageFile` judges,
 * so a folder called `data.log` is not a log and a path with no extension is
 * not anything. The tree still reserves the icon column for a `null` row.
 */
export const driveFileKindOf = (filePath: string): DriveFileKind | null => {
  if (isImageFile(filePath)) return 'image'

  const extension = filePath.split('.').pop()?.toLowerCase() ?? ''

  const kinds = Object.keys(EXTENSIONS_BY_KIND) as Array<
    Exclude<DriveFileKind, 'image'>
  >

  return (
    kinds.find((kind) => EXTENSIONS_BY_KIND[kind].includes(extension)) ?? null
  )
}

/** The media type each previewable format is declared as. */
const IMAGE_CONTENT_TYPES: { [extension: string]: string } = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  bmp: 'image/bmp',
  ico: 'image/x-icon',
  avif: 'image/avif',
  svg: 'image/svg+xml'
}

/**
 * The media type a picture's bytes are handed to the browser as.
 *
 * The drive answers any non-text file as `application/octet-stream`, and Chrome
 * refuses an SVG declared that way inside `<img>` - measured, where a PNG typed
 * the same way is sniffed and does render. Re-typing the blob from the file's
 * own extension makes every preview independent of the drive's conservative
 * Content-Type. The object URL is what the page loads, so the API origin itself
 * still never answers `image/svg+xml`, which is the type that would let an
 * uploaded SVG run script on it.
 */
export const imageContentTypeFor = (filePath: string) =>
  IMAGE_CONTENT_TYPES[filePath.split('.').pop()?.toLowerCase() ?? ''] ??
  'application/octet-stream'

/**
 * A fetched picture's bytes as a blob the browser will draw.
 *
 * `slice` is how a Blob's type is changed: it re-wraps the same bytes, so no
 * copy of the picture is decoded and re-encoded on the way to `<img>`.
 */
export const asImageBlob = (data: Blob, filePath: string) => {
  const type = imageContentTypeFor(filePath)

  return data.type === type ? data : data.slice(0, data.size, type)
}
