import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import FolderView from '../../src/components/folderView'
import type { TreeNode } from '../../src/utils/types'

const calls: string[] = []
let sizes = false

const file = (
  name: string,
  relativePath: string,
  extra: Partial<TreeNode> = {}
): TreeNode => ({
  name,
  relativePath,
  isFolder: false,
  children: [],
  ...extra
})

const folder = (name: string, relativePath: string): TreeNode => ({
  name,
  relativePath,
  isFolder: true,
  children: []
})

/**
 * A level with a folder, two dated files - and sizes only when they are asked for,
 * because the drive's tree does not report them today and the page has to be right
 * both ways.
 */
const levelOf = (): TreeNode[] => [
  folder('macro', '/Public/demo/macro'),
  file('orders.sas', '/Public/demo/orders.sas', {
    created: '2026-10-01T09:00:00.000Z',
    modified: '2026-11-02T10:00:00.000Z',
    ...(sizes ? { size: 2048 } : {})
  }),
  file('run.sas', '/Public/demo/run.sas', {
    created: '2026-10-02T09:00:00.000Z',
    modified: '2026-11-05T08:30:00.000Z',
    ...(sizes ? { size: 1024 } : {})
  })
]

function Harness() {
  const [flip, setFlip] = useState(0)

  Object.assign(window, {
    folderHarness: {
      calls,
      setSizes: (value: boolean) => {
        sizes = value
        setFlip((count) => count + 1)
      },
      redraw: () => setFlip((count) => count + 1)
    }
  })

  const node: TreeNode = {
    name: 'demo',
    relativePath: '/Public/demo',
    isFolder: true,
    children: levelOf()
  }

  return (
    <FolderView
      key={flip}
      path="/Public/demo"
      node={node}
      onOpenFile={(filePath) => calls.push(`file:${filePath}`)}
      onOpenFolder={(folderPath) => calls.push(`folder:${folderPath}`)}
      onSearchInside={(folderPath) => calls.push(`search:${folderPath}`)}
    />
  )
}

createRoot(document.getElementById('root')!).render(<Harness />)
