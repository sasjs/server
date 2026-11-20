/**
 * The folder a reader asked to search, from the drive tree to the header's box.
 *
 * The tree is inside Studio and the box is in the application's header, so
 * neither owns the other: the header is rendered on every screen and does not
 * know the tree exists, and the tree should not have to be threaded through
 * `App` and Studio's props to say one sentence. This module is that sentence, and
 * the one thing it carries is a drive path.
 *
 * A subscription rather than an event or app-wide state, because there is one box
 * and the request is not state a screen keeps: the reader right-clicks a folder,
 * the box takes the path, and nothing needs to remember the request afterwards.
 *
 * The path is the drive-relative one the tree itself uses - `''` for the drive
 * root, `/Public/demo` for a folder under it - so the box walks the same folder
 * the reader clicked rather than resolving a second spelling of it.
 */
type Listener = (folderPath: string) => void

const listeners = new Set<Listener>()

/**
 * Asks the search box to search inside one folder.
 *
 * Called from the tree's context menu. With no box mounted - signed out, or a
 * build where the header is not rendered - the request reaches nobody, which is
 * what it should do: there is nothing to search with.
 */
export const requestFolderSearch = (folderPath: string): void => {
  listeners.forEach((listener) => listener(folderPath))
}

/** Listens for those requests. Returns the unsubscribe, as an effect needs. */
export const onFolderSearch = (listener: Listener): (() => void) => {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}
