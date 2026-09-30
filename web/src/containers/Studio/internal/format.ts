import axios from 'axios'

/**
 * Formats SAS code through the api and returns the formatted text.
 *
 * The code is submitted rather than named as a path, so this formats the
 * buffer, including unsaved changes, and no drive permission is involved.
 * Nothing is executed. When the buffer belongs to a file on the drive, its
 * path names that file so the rules come from the nearest `.sasjslint` at or
 * above the file's folder; an untitled buffer formats against the drive-root
 * rules file.
 *
 * A failure rejects rather than replacing the text: the caller decides
 * whether to surface it or carry on with the buffer as it is.
 */
export const formatSasCode = async (
  code: string,
  filePath?: string
): Promise<string> => {
  const { data } = await axios.post<string>('/SASjsApi/code/format', {
    code,
    filePath
  })

  return typeof data === 'string' ? data : code
}
