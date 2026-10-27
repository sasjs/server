export interface TreeNode {
  name: string
  relativePath: string
  absolutePath: string
  isFolder: boolean
  children: Array<TreeNode>
  /**
   * Whether a FOLDER holds at least one entry. Populated for the immediate
   * children of a folder, so a caller that loaded one level at a time knows to
   * offer an expander before it has requested that folder's contents.
   */
  hasChildren?: boolean
}
