/**
 * Whether a keydown is the editor's Save, and the handler that acts on it.
 *
 * Ctrl+S (Cmd+S on a Mac) is contributed to Monaco as an action, which means it
 * only fires while the editor has text focus. Everywhere else in Studio - the file
 * tree, the log, the print tab, a dialog - the key reaches the browser instead,
 * and the browser offers to save the page: an HTML file of the app, not the buffer
 * on screen.
 *
 * So there are two paths and they must not both fire: Monaco's action when the
 * editor has focus, and a document-level listener for every other focus. Both live
 * here rather than in the hook, so a node script can drive them without a browser -
 * the predicate alone is not the feature, and a test of the predicate alone stays
 * green while the listener is missing or stops preventing the browser's own save.
 */

/** The subset of `KeyboardEvent` the decision needs. */
export interface SaveShortcutEvent {
  key: string
  ctrlKey: boolean
  metaKey: boolean
  /** Alt and Shift are not part of Save; Ctrl+Shift+S must not resolve to it. */
  altKey?: boolean
  shiftKey?: boolean
}

/**
 * Whether this keydown means "save the buffer", given where focus is.
 *
 * `false` when the editor has focus: Monaco's own action handles that one, and
 * answering it here as well would write the same file twice.
 */
export const isSaveShortcut = (
  event: SaveShortcutEvent,
  editorHasFocus: boolean
): boolean => {
  if (editorHasFocus) return false
  if (event.altKey || event.shiftKey) return false
  if (!event.ctrlKey && !event.metaKey) return false

  return event.key.toLowerCase() === 's'
}

/** What the listener needs: the save itself, and where the focus is right now. */
export interface SaveKeyOptions {
  save: () => void
  /** Read at keydown time - focus moves without the listener being re-bound. */
  hasFocus: () => boolean
}

/** The event shape a keydown handler receives, as far as this uses it. */
export interface SaveKeyEvent extends SaveShortcutEvent {
  preventDefault: () => void
}

/**
 * The keydown handler for the document.
 *
 * `preventDefault` is part of the feature, not politeness: without it the browser's
 * own Save dialog opens over the app while the buffer is also being written.
 */
export const createSaveKeyHandler = (
  options: SaveKeyOptions
): ((event: SaveKeyEvent) => void) => {
  return (event) => {
    if (!isSaveShortcut(event, options.hasFocus())) return

    event.preventDefault()
    options.save()
  }
}

/** The part of a document this binding needs. */
export interface KeyEventTarget {
  addEventListener: (type: 'keydown', handler: (event: any) => void) => void
  removeEventListener: (type: 'keydown', handler: (event: any) => void) => void
}

/**
 * Bind the handler to a document, returning the unbind.
 *
 * Kept here for the same reason as the handler: a listener that is never bound is the
 * failure this feature was, and nothing in the component tree makes that visible. A script
 * can hand this a stand-in document and watch the binding happen and come undone.
 */
export const bindSaveShortcut = (
  target: KeyEventTarget,
  handler: (event: SaveKeyEvent) => void
): (() => void) => {
  target.addEventListener('keydown', handler)

  return () => target.removeEventListener('keydown', handler)
}
