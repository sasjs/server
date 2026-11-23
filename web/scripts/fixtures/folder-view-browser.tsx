import React, { useLayoutEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import FolderView from '../../src/components/folderView'
import type { TreeNode } from '../../src/utils/types'

const calls: string[] = []
const requests: string[] = []
let sizes = false
// A folder the tree has a node for but nobody has read: what a deep link to a level
// looks like before its request comes back.
let unread = false
// Hold every folder read, so a scan can be in flight while the page changes under it.
let hold = false
let held: (() => void) | undefined
let staleHeldTree = false
let completedHeldTree = 0
let typeOnPath = ''
let refusedFolders: string[] = []

// React input tracking must see a native edit, not a direct assignment to its own
// value setter. Dispatch during layout to model input before passive effects run.
function EarlyTyping({ path }: { path: string }) {
  useLayoutEffect(() => {
    if (!typeOnPath) return
    const input = document.querySelector('input')!
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value'
    )!.set!.call(input, typeOnPath)
    input.dispatchEvent(new Event('input', { bubbles: true }))
    typeOnPath = ''
  }, [path])
  return null
}

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
const levelOf = (folderPath: string): TreeNode[] => {
  if (
    folderPath === '/many' ||
    folderPath === '/many2' ||
    folderPath === '/many3'
  )
    return Array.from({ length: folderPath === '/many3' ? 37 : 20 }, (_, i) =>
      file(
        `match${String(i).padStart(2, '0')}.bin`,
        `${folderPath}/match${String(i).padStart(2, '0')}.bin`
      )
    )
  if (folderPath === '/Public/macro')
    return [file('abort.sas', '/Public/macro/abort.sas')]
  // the subfolder the demo level lists, so a walk of `/Public/demo` has somewhere
  // to go and does not fall through to the level above
  if (folderPath === '/Public/demo/macro') return []

  return [
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
}

/** The bodies the folder's search reads - one of them mentions `orders`. */
const BODIES: { [path: string]: string } = {
  '/Public/demo/orders.sas': '/* the order report */',
  '/Public/demo/run.sas': '%let report = 1;\n%include "orders";',
  '/Public/macro/abort.sas': '%macro abort;\ndata _null_;'
}

axios.defaults.adapter = async (config) => {
  const url = config.url ?? ''

  if (url === '/SASjsApi/drive/fileTree') {
    const folderPath = config.params?._folderPath ?? ''

    requests.push(`fileTree:${folderPath}`)
    if (refusedFolders.includes(folderPath)) throw new Error('refused')

    const wasHeld = hold
    if (wasHeld) {
      await new Promise<void>((resolve) => {
        held = resolve
      })
      completedHeldTree++
    }

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
          children:
            wasHeld && staleHeldTree
              ? [file('stale-orders.bin', `${folderPath}/stale-orders.bin`)]
              : levelOf(folderPath)
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
  const [path, setPath] = useState('/Public/demo')

  Object.assign(window, {
    folderHarness: {
      calls,
      requests,
      setRefusedFolders: (paths: string[]) => {
        refusedFolders = paths
      },
      get completedHeldTree() {
        return completedHeldTree
      },
      setStaleHeldTree: (value: boolean) => {
        staleHeldTree = value
      },
      setPath,
      typeDuringNextPath: (value: string) => {
        typeOnPath = value
      },
      setSizes: (value: boolean) => {
        sizes = value
        setFlip((count) => count + 1)
      },
      setUnread: (value: boolean) => {
        unread = value
        setFlip((count) => count + 1)
      },
      setHold: (value: boolean) => {
        hold = value
      },
      release: () => {
        held?.()
        held = undefined
      }
    }
  })

  const node: TreeNode = unread
    ? {
        // what the tree holds for a level nobody has fetched yet
        name: 'demo',
        relativePath: '/Public/demo',
        isFolder: true,
        hasChildren: true,
        children: []
      }
    : {
        name: path.split('/').pop() || 'files',
        relativePath: path,
        isFolder: true,
        childrenLoaded: true,
        children: levelOf(path)
      }

  return (
    <>
      <FolderView
        key={flip}
        path={path}
        node={node}
        onOpenFile={(filePath) => calls.push(`file:${filePath}`)}
        onOpenFolder={(folderPath) => calls.push(`folder:${folderPath}`)}
      />
      <EarlyTyping path={path} />
    </>
  )
}

createRoot(document.getElementById('root')!).render(<Harness />)
