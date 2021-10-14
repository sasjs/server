import dirTree from 'directory-tree'
import path from 'path'

export const sasjsExecutor = () => {
  const tree = dirTree(path.join(__dirname, '..', '..', 'tmp'))
  return tree
}
