/**
 * The folder a reader asked to search, from the drive tree to Studio.
 *
 * The tree is inside Studio and the folder page is Studio's main pane, so neither
 * owns the other: the tree cannot navigate, and Studio should not have to be
 * threaded through the tree's props to hear one sentence. This module is that
 * sentence, and the one thing it carries is a drive path.
 *
 * What the request means: OPEN THAT FOLDER'S PAGE with its search box focused. The
 * folder page carries its own search, so the request is a navigation rather than a
 * change of state somewhere else on the screen - a menu item in the tree has no
 * business rewriting a control in the header, and the reader who chose it is
 * looking at the folder.
 *
 * A subscription rather than app-wide state, because there is one listener and the
 * request is not state any screen keeps: the reader right-clicks a folder, Studio
 * navigates, and nothing needs to remember it afterwards.
 *
 * The path is the drive-relative one the tree itself uses - '' for the drive root,
 * `/Public/demo` for a folder under it.
 */
type Listener = (folderPath: string) => void

const listeners = new Set<Listener>()

/**
 * Asks Studio to open a folder's page, ready to search it.
 *
 * Called from the tree's context menu. With Studio not mounted - a build where the
 * tree is rendered without it - the request reaches nobody, which is what it should
 * do: there is no page to open.
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
