import axios from 'axios'

/**
 * Formats SAS code through the api and returns the formatted text.
 *
 * The code is submitted rather than named as a path, so this formats the
 * buffer, including unsaved changes, and no drive permission is involved.
 * Nothing is executed. Rules come from the same `.sasjslint` resolution the
 * lint endpoint uses.
 *
 * A failure rejects rather than replacing the text: the caller decides
 * whether to surface it or carry on with the buffer as it is.
 */
export const formatSasCode = async (code: string): Promise<string> => {
  const { data } = await axios.post<string>('/SASjsApi/code/format', { code })

  return typeof data === 'string' ? data : code
}
