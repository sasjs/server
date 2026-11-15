/**
 * What the picker offers.
 *
 * The endpoint takes a zip - the package, `sasjs.app.json` plus `web/` and an
 * optional `backend/` - and the older `.json` deploy document. A picker listing
 * only `.json` refuses the archive the copy above it advertises, before the
 * request is made: `accept` is a filter, not a hint, so a browser that honours it
 * makes the zip unselectable rather than merely discouraged.
 *
 * Both extensions and both types are listed. The types are what a system picker
 * matches on a file it has already sniffed, and a zip chosen from a share that
 * types it `application/x-zip-compressed` would otherwise be greyed out.
 */
export const ACCEPTED_BUILDS =
  '.json,.zip,application/json,application/zip,application/x-zip-compressed'

/**
 * The form the deploy endpoint expects.
 *
 * Exported so a test can pin the field name: the server reads `file`, and a
 * rename here publishes nothing while looking like it worked.
 */
export const deployFormFor = (file: File): FormData => {
  const formData = new FormData()

  formData.append('file', file)

  return formData
}
