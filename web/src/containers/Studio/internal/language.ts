/**
 * Which Monaco language a drive file is handed to.
 *
 * Extension is the question nearly every time, and `plaintext` the honest answer
 * for anything unlisted - Monaco then gives a buffer with no colouring, no
 * folding and no diagnostics, which is fine for a file nothing knows.
 *
 * The exception is the drive's rules file. `.sasjslint` IS JSON, and a dotfile:
 * its dot is the first character of the name, so it names no extension at all and
 * the extension map cannot reach it. Left to the map it opened as plain text -
 * no highlighting, no folding, no bracket matching, and none of the JSON
 * diagnostics that would point at a misplaced comma in a file whose whole job is
 * to be parsed.
 */
const languageByExtension: Record<string, string> = {
  sas: 'sas',
  js: 'javascript',
  ts: 'typescript',
  py: 'python',
  r: 'r',
  sql: 'sql',
  md: 'markdown',
  mdx: 'markdown',
  json: 'json',
  html: 'html',
  css: 'css',
  yaml: 'yaml',
  xml: 'xml',
  sh: 'shell'
}

/** The drive's lint rules file, which no extension list can name. */
const LINT_FILE = '.sasjslint'

/** The language id for a file, judged by its name first and its extension after. */
export const languageForFile = (
  filePath: string,
  extension: string
): string => {
  const name = (filePath.split('/').pop() ?? '').toLowerCase()

  if (name === LINT_FILE) return 'json'

  return languageByExtension[extension.toLowerCase()] ?? 'plaintext'
}
