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
 * The extension of a drive path, lower-cased, or '' when it has none.
 *
 * The one definition of "the extension of this path", because the alternatives disagree on
 * exactly the inputs that matter. `split('.').pop()` answers the whole path for `/a/program`,
 * `sasjsrc` for `/a/b/.sasjsrc` and `b/program` for `/a.b/program` - none of which is an
 * extension, and the first of which is a path. Every question about a file's format goes
 * through here: which icon it gets, whether it is a picture, which run time runs it, whether
 * the Studio offers Run on it at all.
 */
export const extensionOf = (filePath: string): string => {
  const name = String(filePath || '')
    .split('/')
    .pop()

  if (!name) return ''

  const dot = name.lastIndexOf('.')

  // `.sasjsrc` names no extension; a leading dot is part of the name
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : ''
}

/** Whether a drive path is a picture, judged by its extension. */
export const isImageFile = (filePath: string) =>
  IMAGE_EXTENSIONS.includes(extensionOf(filePath))

/**
 * What a drive entry is, as far as the tree's icon column is concerned.
 *
 * `image` is not listed by extension here: the previewable formats are
 * `IMAGE_EXTENSIONS`, so the two cannot drift.
 */
export type DriveFileKind =
  | 'program'
  | 'script'
  | 'markup'
  | 'config'
  | 'data'
  | 'table'
  | 'log'
  | 'text'
  | 'document'
  | 'archive'
  | 'image'

/**
 * The extensions behind every kind but `image`, which reuses the image list.
 *
 * The list is the set of files a drive actually holds rather than every format
 * in existence: a program the host can run, the scripts beside it, the markup a
 * streamed app is built from, the config a project carries, SAS datasets and the
 * exports an analyst puts next to them, logs, text, office documents and
 * archives. An extension in none of them gets the reserved blank column, which is
 * the same treatment as a name with no extension at all.
 */
const EXTENSIONS_BY_KIND: {
  [kind in Exclude<DriveFileKind, 'image'>]: string[]
} = {
  // SAS is the one kind with its own mark; the others are glyphs
  program: ['sas'],
  script: ['js', 'mjs', 'cjs', 'jsx', 'ts', 'tsx', 'py', 'r', 'sh', 'bash'],
  markup: ['html', 'htm', 'css', 'scss', 'less', 'xml', 'yml', 'yaml'],
  config: ['json', 'sasjslint', 'toml', 'ini', 'conf', 'env'],
  data: ['sas7bdat', 'sas7bcat', 'xpt', 'parquet', 'dta', 'rds', 'sav'],
  table: ['csv', 'tsv', 'xls', 'xlsx', 'xlsm'],
  log: ['log'],
  text: ['txt', 'md', 'markdown', 'rst'],
  document: ['doc', 'docx', 'odt', 'rtf', 'pdf', 'ppt', 'pptx', 'key', 'pages'],
  archive: ['zip', 'gz', 'tgz', 'tar', '7z', 'rar']
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

  // `.sasjslint` is the drive's own rules file, and it is a DOTFILE: the dot is
  // the first character of the name, so its extension is nothing at all and the
  // list cannot catch it. A file that merely carries the extension -
  // `my.sasjslint` - is in the list like any other JSON, and this line is not
  // what answers for it.
  //
  // Everything else is judged by the extension alone: a file called `key` or `r`
  // is not a document or an R script, which is what asking for the whole name
  // answered once the lists grew.
  const name = (filePath.split('/').pop() ?? '').toLowerCase()

  if (name === '.sasjslint') return 'config'

  const extension = extensionOf(filePath)

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
  IMAGE_CONTENT_TYPES[extensionOf(filePath)] ?? 'application/octet-stream'

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
