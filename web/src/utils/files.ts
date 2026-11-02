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
