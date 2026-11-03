/**
 * Keeps a mouse gesture from pasting into the editor.
 *
 * The editor is an editable surface, so the browser pastes into it on its own
 * initiative: a middle click pastes the primary selection on X11, and a context
 * menu that opens under the pointer takes the click that follows. Either one
 * arrives as text appearing in the program with no key pressed, which reads as
 * the editor pasting by itself.
 *
 * A press of a secondary button on the text area arms the guard, and the paste
 * that follows within the window is dropped. A left press does not arm it, so
 * Ctrl+V straight after clicking into the code still pastes, and a Paste chosen
 * from the editor's own menu - which renders outside this node - is untouched.
 */

/** How long a secondary press can lead to a paste before the press is stale. */
export const MOUSE_PASTE_WINDOW_MS = 1000

/** Arms on a secondary press and drops the paste that follows one. */
export const guardMousePaste = (node: HTMLElement): (() => void) => {
  // null until a secondary press arms it: an unarmed guard must not depend on
  // the clock, which on a freshly loaded page has barely started.
  let armedAt: number | null = null

  const arm = (event: MouseEvent) => {
    if (event.button !== 0) armedAt = Date.now()
  }

  const dropPaste = (event: Event) => {
    if (armedAt === null || Date.now() - armedAt > MOUSE_PASTE_WINDOW_MS) return

    armedAt = null

    event.preventDefault()
    // Capture on an ancestor: stopping here is what keeps the editor from
    // seeing the event at all, and cancelling it is what stops the browser
    // writing the clipboard in on its own.
    event.stopPropagation()
  }

  node.addEventListener('mousedown', arm, true)
  node.addEventListener('paste', dropPaste, true)

  return () => {
    node.removeEventListener('mousedown', arm, true)
    node.removeEventListener('paste', dropPaste, true)
  }
}
