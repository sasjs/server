import type { TreeNode } from './types'

/** The drive root's relativePath: '' rather than '/'. */
export const ROOT_PATH = ''

/**
 * Suffix of the placeholder child rendered under a folder whose contents have
 * not been fetched yet. Exported so the click handler can refuse to open it.
 */
export const LOADING_SUFFIX = '::loading'

/** '' for the drive root, '/Public/foo' for a folder under it. */
export const parentPathOf = (relativePath: string) => {
  const segments = relativePath.split('/')
  segments.pop()
  return segments.join('/')
}

/** Every ancestor of a path, root first: '/a/b/c.sas' -> ['', '/a', '/a/b']. */
export const ancestorPathsOf = (relativePath: string) => {
  const segments = relativePath.split('/').filter(Boolean)
  segments.pop()

  const paths = [ROOT_PATH]
  let current = ''

  for (const segment of segments) {
    current += '/' + segment
    paths.push(current)
  }

  return paths
}

/**
 * Grafts one folder level into the tree, returning a new tree.
 *
 * The node named by `relativePath` is REPLACED rather than merged: a freshly
 * fetched level is the folder's complete contents, so anything the old node
 * carried beneath it is stale.
 */
export const withLevel = (
  node: TreeNode,
  relativePath: string,
  level: TreeNode
): TreeNode =>
  node.relativePath === relativePath
    ? level
    : {
        ...node,
        children: node.children.map((child) =>
          withLevel(child, relativePath, level)
        )
      }

/**
 * The expanded folders underneath `folderPath`, nearest first.
 *
 * Replacing a folder level drops the loaded levels beneath it, but the folders
 * the user has open stay open - so they have to be fetched again, or the tree
 * settles on a `Loading...` placeholder that nothing ever resolves because
 * expansion is what triggers a fetch.
 */
export const expandedDescendantsOf = (
  expanded: Iterable<string>,
  folderPath: string
): string[] => {
  const prefix = folderPath === ROOT_PATH ? '/' : `${folderPath}/`

  return Array.from(expanded)
    .filter((path) => path !== folderPath && path.startsWith(prefix))
    .sort((a, b) => a.split('/').length - b.split('/').length)
}

/** The children to render under one node. */
export const childrenOf = (nodes: TreeNode): TreeNode[] => {
  if (nodes.children.length) return nodes.children

  // A folder is expanded on demand, so an empty `children` array means either
  // "empty folder" or "not fetched yet". `childrenLoaded` tells them apart:
  // until it is set, a folder the API reported as non-empty gets a single
  // placeholder child, which is what gives it an expander.
  if (nodes.isFolder && nodes.hasChildren && !nodes.childrenLoaded)
    return [
      {
        name: 'Loading...',
        relativePath: `${nodes.relativePath}${LOADING_SUFFIX}`,
        isFolder: false,
        children: []
      }
    ]

  return []
}
