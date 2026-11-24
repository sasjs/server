/**
 * Binding a keyboard shortcut to the document.
 *
 * Studio's shortcuts are registered at the document rather than inside Monaco,
 * because Monaco only sees a key while its textarea has focus: a shortcut that
 * fires with focus in the file tree, the log or a dialog needs a listener the
 * whole page shares. Kept here rather than inline in a hook so a node script can
 * hand it a stand-in document and watch the binding happen and come undone.
 */

/** The subset of `KeyboardEvent` a shortcut decision needs. */
export interface ShortcutEvent {
  key: string
  ctrlKey: boolean
  metaKey: boolean
  altKey?: boolean
  shiftKey?: boolean
}

/** The event shape a keydown handler receives, as far as these use it. */
export interface ShortcutKeyEvent extends ShortcutEvent {
  preventDefault: () => void
}

/** The part of a document a binding needs. */
export interface KeyEventTarget {
  addEventListener: (type: 'keydown', handler: (event: any) => void) => void
  removeEventListener: (type: 'keydown', handler: (event: any) => void) => void
}

/**
 * Bind the handler to a document, returning the unbind.
 *
 * A listener that is never bound is the failure a shortcut feature is, and
 * nothing in the component tree makes that visible.
 */
export const bindKeydown = (
  target: KeyEventTarget,
  handler: (event: ShortcutKeyEvent) => void
): (() => void) => {
  target.addEventListener('keydown', handler)

  return () => target.removeEventListener('keydown', handler)
}
