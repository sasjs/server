export interface TreeNode {
  name: string
  relativePath: string
  absolutePath: string
  isFolder: boolean
  children: Array<TreeNode>
}
