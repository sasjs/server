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
 * The width a window needs before two panes are worth it.
 *
 * The Studio's sidebar takes ~250px and the line numbers another ~60, so below
 * this a split leaves two columns of about forty characters - narrower than the
 * `.sasjslint` this repository lints at.
 */
export const SPLIT_VIEW_MIN_WIDTH = 1200

/** Whether the window is wide enough for the editor and a rendering side by side. */
export const hasRoomForSplit = (width: number | undefined): boolean =>
  typeof width === 'number' && width >= SPLIT_VIEW_MIN_WIDTH

/**
 * The mode to open a file in: the one last chosen for its kind, else a default.
 *
 * The default is `split` on a window with room for it, and `source` otherwise: a
 * reader opening a README or a JSON document wants the text and the rendering at
 * once, and the toggle is one click away when the window is narrow. CSV keeps the
 * same default - a table beside its columns is how a CSV is read.
 *
 * A choice the user made is never overruled by the default, including a choice of
 * `source` on a wide window: the toggle's answer is remembered per kind, and this
 * only decides what an unanswered kind opens as.
 */
export const storedDisplayMode = (
  filePath: string,
  options: {
    storage?: Pick<Storage, 'getItem'>
    width?: number
  } = {}
): DisplayMode => {
  const modes = displayModesFor(filePath)
  if (!modes.length) return 'source'

  const fallback: DisplayMode = hasRoomForSplit(options.width)
    ? 'split'
    : 'source'

  /*
   * The lookup is inside the try, and `globalThis.localStorage` with it: a page
   * that refuses storage - blocked cookies, a sandboxed frame - throws on the
   * PROPERTY ACCESS, not only on the call, so a default parameter would throw
   * before this body ran and take the editor down with it.
   */
  try {
    const store = options.storage ?? globalThis.localStorage
    const stored = store?.getItem(displayModeStorageKey(filePath))

    return modes.includes(stored as DisplayMode)
      ? (stored as DisplayMode)
      : fallback
  } catch {
    return fallback
  }
}
