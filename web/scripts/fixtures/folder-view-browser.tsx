import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import FolderView from '../../src/components/folderView'
import type { TreeNode } from '../../src/utils/types'

const calls: string[] = []
const requests: string[] = []
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
 * The level the page shows. Sizes are included only when they are asked for,
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

/** The bodies the folder's search reads - one of them mentions `orders`. */
const BODIES: { [path: string]: string } = {
  '/Public/demo/orders.sas': '/* the order report */',
  '/Public/demo/run.sas': '%let report = 1;\n%include "orders";'
}

axios.defaults.adapter = async (config) => {
  const url = config.url ?? ''

  if (url === '/SASjsApi/drive/fileTree') {
    const folderPath = config.params?._folderPath ?? ''

    requests.push(`fileTree:${folderPath}`)

    return {
      config,
      status: 200,
      statusText: 'OK',
      headers: {},
      data: {
        status: 'success',
        tree: {
          relativePath: folderPath,
          isFolder: true,
          children: folderPath === '/Public/demo' ? levelOf() : []
        }
      }
    }
  }

  if (url === '/SASjsApi/drive/file') {
    const filePath = config.params?._filePath ?? ''

    requests.push(`file:${filePath}`)

    const body = BODIES[filePath]

    if (body === undefined) throw new Error('refused')

    return { config, status: 200, statusText: 'OK', headers: {}, data: body }
  }

  requests.push(url)

  return { config, status: 200, statusText: 'OK', headers: {}, data: {} }
}

function Harness() {
  const [flip, setFlip] = useState(0)

  Object.assign(window, {
    folderHarness: {
      calls,
      requests,
      setSizes: (value: boolean) => {
        sizes = value
        setFlip((count) => count + 1)
      }
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
    />
  )
}

createRoot(document.getElementById('root')!).render(<Harness />)
