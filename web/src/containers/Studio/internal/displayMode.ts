/**
 * Which display modes a file offers, and what they are called.
 *
 * The Studio edits text in Monaco, which is the right surface for a program and a
 * poor one for the files that are not programs: a README is prose, a CSV is a
 * table, and a JSON document is a shape you read by opening one branch of it. So
 * a file with a rendering offers three modes - the source, the rendering, and the
 * two side by side - and every other file keeps the editor it has always had.
 *
 * What a file is comes from its path rather than its extension, because one of
 * the JSON files on a drive has no extension: `.sasjslint` is the lint rules file,
 * and a reader opening it wants the tree as much as they want it for
 * `sasjsconfig.json`.
 *
 * `rendered` is one mode with three meanings, because the three files differ in
 * what "rendered" is: a page, a table, a tree. The label follows the file, so the
 * toggle says what it will do rather than naming an abstraction.
 */
import { extensionOf } from '../../../utils/files'

export type DisplayMode = 'source' | 'split' | 'rendered'

/** The kind of rendering a file has, when it has one. */
export type DisplayKind = 'markdown' | 'csv' | 'json'

const kindByExtension: Record<string, DisplayKind> = {
  md: 'markdown',
  markdown: 'markdown',
  csv: 'csv',
  json: 'json'
}

/** The label the third mode carries for each kind of rendering. */
const labelByKind: Record<DisplayKind, string> = {
  markdown: 'Preview',
  csv: 'Table',
  json: 'Tree'
}

/** Every mode, in the order the toggle shows them. */
export const DISPLAY_MODES: DisplayMode[] = ['source', 'split', 'rendered']

/** The rendering a file has, or null when the editor is its only surface. */
export const displayKindOf = (filePath: string): DisplayKind | null => {
  const name = filePath.split('/').pop() ?? ''

  // The lint rules file is JSON that a reader opens to read; the drive's dotfile
  // naming means `extensionOf` answers '' for it.
  if (name.toLowerCase() === '.sasjslint') return 'json'

  return kindByExtension[extensionOf(filePath)] ?? null
}

/** The modes a file offers, or [] when the editor is the only sensible surface. */
export const displayModesFor = (filePath: string): DisplayMode[] =>
  displayKindOf(filePath) ? DISPLAY_MODES : []

/** What a mode is called for a file, eg `Tree` rather than `Preview` for JSON. */
export const displayModeLabel = (
  mode: DisplayMode,
  filePath: string
): string => {
  if (mode === 'source') return 'Source'
  if (mode === 'split') return 'Split'

  const kind = displayKindOf(filePath)

  return kind ? labelByKind[kind] : 'Rendered'
}

/** Where a kind of file's chosen mode is remembered, per browser. */
export const displayModeStorageKey = (filePath: string): string =>
  `studio.displayMode.${displayKindOf(filePath) ?? 'none'}`

/**
 * The mode to open a file in: the one last chosen for its kind, else the source.
 *
 * The source is the default on purpose. A file opened to be edited must open on
 * the text - a preview that hides the text would be a mode the user has to leave
 * before typing - and only a rendering with no edits in it is worth remembering.
 * The choice is per kind rather than per file, so a reader who reads CSVs as
 * tables gets the next CSV as a table.
 */
export const storedDisplayMode = (
  filePath: string,
  storage: Pick<Storage, 'getItem'> | undefined = globalThis.localStorage
): DisplayMode => {
  const modes = displayModesFor(filePath)
  if (!modes.length) return 'source'

  const stored = storage?.getItem(displayModeStorageKey(filePath))

  return modes.includes(stored as DisplayMode)
    ? (stored as DisplayMode)
    : 'source'
}
