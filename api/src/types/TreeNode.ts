export interface TreeNode {
  name: string
  relativePath: string
  absolutePath: string
  isFolder: boolean
  /**
   * ISO timestamp of the last write. Stated for FILES, from the filesystem's
   * own metadata; a folder states none, because its date would be whichever
   * child was written first.
   */
  modified?: string
  /**
   * ISO timestamp of creation, from the filesystem's `birthtime`. Present for
   * files; see `modified` for why folders carry neither.
   */
  created?: string
  children: Array<TreeNode>
  /**
   * Whether a FOLDER holds at least one entry. Populated for the immediate
   * children of a folder, so a caller that loaded one level at a time knows to
   * offer an expander before it has requested that folder's contents.
   */
  hasChildren?: boolean
}
