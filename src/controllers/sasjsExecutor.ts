import fs from 'fs'
import { TreeNode } from '../types'
import { getTmpFilesFolderPath } from '../utils'

export const sasjsExecutor = () => {
  const root: TreeNode = {
    name: 'files',
    relativePath: '',
    absolutePath: getTmpFilesFolderPath(),
    children: []
  }

  const stack = [root]

  while (stack.length) {
    const currentNode = stack.pop()

    if (currentNode) {
      const children = fs.readdirSync(currentNode.absolutePath)

      for (let child of children) {
        const absoluteChildPath = `${currentNode.absolutePath}/${child}`
        const relativeChildPath = `${currentNode.relativePath}/${child}`
        const childNode: TreeNode = {
          name: child,
          relativePath: relativeChildPath,
          absolutePath: absoluteChildPath,
          children: []
        }
        currentNode.children.push(childNode)

        if (fs.statSync(childNode.absolutePath).isDirectory()) {
          stack.push(childNode)
        }
      }
    }
  }

  return root
}
