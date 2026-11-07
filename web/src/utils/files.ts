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
