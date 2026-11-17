import axios from 'axios'

/**
 * How the buffer is rewritten. Two of these exist because two of them are
 * useful, and for the two different jobs an author has in mind when they press
 * a button:
 *
 * - `format` runs the layout engine as well as the rules, so statement breaks
 *   and indentation are rewritten as well as the spacing, case and header
 * - `fix` runs the rules alone - the changes that can be made without
 *   judgement. An author who wants their trailing spaces and line endings dealt
 *   with, but does not want their program re-laid-out, asks for this one
 */
export type SasFormatMode = 'format' | 'fix'

/**
 * Formats SAS code through the api and returns the rewritten text.
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
  filePath?: string,
  mode: SasFormatMode = 'format'
): Promise<string> => {
  const { data } = await axios.post<string>('/SASjsApi/code/format', {
    code,
    filePath,
    // Sent explicitly rather than left to the route's default: the request
    // states which of the two jobs it wants, so a change to the default cannot
    // silently turn one button into the other.
    layout: mode === 'format'
  })

  return typeof data === 'string' ? data : code
}
