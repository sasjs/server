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
