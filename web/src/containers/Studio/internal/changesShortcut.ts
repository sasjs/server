/**
 * Whether a keydown means "show the changes", and the handler that acts on it.
 *
 * A diff is something the author asks for, not something a save does on their
 * behalf, so the shortcut is what makes it cheap to ask: Ctrl+Shift+D (Cmd+Shift+D
 * on a Mac) from anywhere in Studio, including while typing in the editor.
 *
 * Unlike Save there is no Monaco action to share the key with, so the binding
 * covers every focus and the browser's own Ctrl+Shift+D (bookmark all tabs) is
 * prevented rather than left to open over the app.
 */
import { bindKeydown } from './keydown'
import type { ShortcutEvent, ShortcutKeyEvent } from './keydown'

/**
 * Whether this keydown means "show the changes".
 *
 * Shift is part of the combination, so Ctrl+D - the editor's add-next-occurrence
 * - never reaches this handler with the same meaning.
 */
export const isChangesShortcut = (event: ShortcutEvent): boolean => {
  if (event.altKey || !event.shiftKey) return false
  if (!event.ctrlKey && !event.metaKey) return false

  return event.key.toLowerCase() === 'd'
}

/** What the listener needs: the action, and nothing about where focus is. */
export interface ChangesKeyOptions {
  showChanges: () => void
}

/** The keydown handler for the document. */
export const createChangesKeyHandler = (
  options: ChangesKeyOptions
): ((event: ShortcutKeyEvent) => void) => {
  return (event) => {
    if (!isChangesShortcut(event)) return

    event.preventDefault()
    options.showChanges()
  }
}

/** Bind the handler to a document, returning the unbind. */
export const bindChangesShortcut = bindKeydown
