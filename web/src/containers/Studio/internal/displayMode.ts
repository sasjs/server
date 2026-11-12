/**
 * Which display modes a file offers, and what they are called.
 *
 * The Studio edits text in Monaco, which is the right surface for a program and a
 * poor one for the files that are not programs: a README is prose, a CSV is a
 * table, and a JSON document is a shape you read by opening one branch of it. So
 * a file whose extension has a rendering offers three modes - the source, the
 * rendering, and the two side by side - and every other file keeps the editor it
 * has always had.
 *
 * `rendered` is one mode with three meanings, because the three files differ in
 * what "rendered" is: a page, a table, a tree. The label follows the file, so the
 * toggle says what it will do rather than naming an abstraction.
 */
export type DisplayMode = 'source' | 'split' | 'rendered'

/** The extension a file's display modes are decided by, or '' for none. */
const modesByExtension: Record<string, { label: string }> = {
  md: { label: 'Preview' },
  markdown: { label: 'Preview' },
  csv: { label: 'Table' },
  json: { label: 'Tree' }
}

/** Every mode, in the order the toggle shows them. */
export const DISPLAY_MODES: DisplayMode[] = ['source', 'split', 'rendered']

/** The modes a file offers, or [] when the editor is the only sensible surface. */
export const displayModesFor = (extension: string): DisplayMode[] =>
  modesByExtension[extension.toLowerCase()] ? DISPLAY_MODES : []

/** What a mode is called for a file, eg `Tree` rather than `Preview` for JSON. */
export const displayModeLabel = (
  mode: DisplayMode,
  extension: string
): string => {
  if (mode === 'source') return 'Source'
  if (mode === 'split') return 'Split'

  return modesByExtension[extension.toLowerCase()]?.label ?? 'Rendered'
}

/** Where a file type's chosen mode is remembered, per browser. */
export const displayModeStorageKey = (extension: string): string =>
  `studio.displayMode.${extension.toLowerCase()}`

/**
 * The mode to open a file in: the one last chosen for its type, else the source.
 *
 * The source is the default on purpose. A file opened to be edited must open on
 * the text - a preview that hides the text would be a mode the user has to leave
 * before typing - and only a rendering with no edits in it is worth remembering.
 */
export const storedDisplayMode = (
  extension: string,
  storage: Pick<Storage, 'getItem'> | undefined = globalThis.localStorage
): DisplayMode => {
  const modes = displayModesFor(extension)
  if (!modes.length) return 'source'

  const stored = storage?.getItem(displayModeStorageKey(extension))

  return modes.includes(stored as DisplayMode)
    ? (stored as DisplayMode)
    : 'source'
}
