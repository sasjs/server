export interface TreeNode {
  name: string
  relativePath: string
  absolutePath: string
  children: Array<TreeNode>
}
