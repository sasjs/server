import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import axios from 'axios'
import Search from '../../src/components/search'
import TreeView from '../../src/components/tree'
import { AppContext, ModeType } from '../../src/context/appContext'
import type { TreeNode } from '../../src/utils/types'

const requests: string[] = []
let release: (() => void) | undefined
let hold = false
let fail = false
let empty = false
// A drive with a folder in it, for the search the tree starts. Off by default:
// the rest of this suite asserts a one-file drive, and a second folder in the
// root listing would make its walk one request longer.
let folders = false
// A folder with more text files than one search reads, for the note that says so.
let wide = false

const file = (name: string, relativePath: string): TreeNode => ({
  name,
  relativePath,
  isFolder: false,
  children: []
})

const folder = (name: string, relativePath: string): TreeNode => ({
  name,
  relativePath,
  isFolder: true,
  children: []
})

/** One folder's children, as the API answers for `_folderPath`. */
const levelOf = (folderPath: string): TreeNode[] => {
  if (empty) return []

  if (!folders)
    return folderPath === '' ? [file('orders.sas', '/reports/orders.sas')] : []

  if (folderPath === '')
    return [folder('services', '/services'), folder('reports', '/reports')]
  if (folderPath === '/services') {
    if (wide)
      return Array.from({ length: 205 }, (_, index) =>
        file(`f${index}.sas`, `/services/f${index}.sas`)
      )

    return [
      file('orders.sas', '/services/orders.sas'),
      file('run.sas', '/services/run.sas'),
      file('logo.png', '/services/logo.png')
    ]
  }
  if (folderPath === '/reports')
    return [file('orders.sas', '/reports/orders.sas')]

  return []
}

/**
 * The bodies a folder search reads.
 *
 * `logo.png` has no entry: a picture is not a file a search asks for, and the
 * request log is asserted to prove it was never asked for.
 */
const BODIES: { [path: string]: string } = {
  '/services/orders.sas': '/* the orders report */\ndata orders; run;',
  '/services/run.sas': '%let report = 1;\n%include "orders";',
  '/reports/orders.sas': 'data orders; run;'
}

axios.defaults.adapter = async (config) => {
  const url = config.url ?? ''

  if (url === '/SASjsApi/drive/fileTree' || url === '/SASjsApi/drive/file')
    requests.push(
      `${url}:${config.params?._folderPath ?? config.params?._filePath}`
    )
  else requests.push(url)

  if (url === '/SASjsApi/drive/fileTree') {
    if (hold)
      await new Promise<void>((resolve) => {
        release = resolve
      })
    if (fail) throw new Error('unreadable')

    const folderPath = config.params?._folderPath ?? ''

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
          children: levelOf(folderPath)
        }
      }
    }
  }

  if (url === '/SASjsApi/drive/file') {
    const filePath = config.params?._filePath ?? ''
    const body = /^\/services\/f\d+\.sas$/.test(filePath)
      ? 'data orders; run;'
      : BODIES[filePath]

    // a refusal, as a file the caller may not read answers
    if (body === undefined) throw new Error('refused')

    return {
      config,
      status: 200,
      statusText: 'OK',
      headers: {},
      data: body
    }
  }

  return {
    config,
    status: 200,
    statusText: 'OK',
    headers: {},
    data: {
      apps: [{ id: 'a', name: 'orders app', appLoc: null, url: '/app/a/' }]
    }
  }
}
window.fetch = async (input) => {
  const url = String(input)
  requests.push(url)
  return new Response(
    JSON.stringify(
      url.includes('search_index')
        ? { docs: [{ location: 'orders/', title: 'Orders docs', text: '' }] }
        : [{ method: 'GET', path: '/orders', summary: 'orders' }]
    ),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
}

/** The tree a reader right-clicks, when `folders` is on. */
const treeOf = (): TreeNode => ({
  name: 'files',
  relativePath: '',
  isFolder: true,
  children: [folder('services', '/services'), folder('reports', '/reports')]
})

function Harness() {
  const navigate = useNavigate()
  const [allowed, setAllowed] = useState(true)
  const [signedIn, setSignedIn] = useState(true)
  Object.assign(window, {
    searchHarness: {
      requests,
      navigate,
      setAllowed,
      setSignedIn,
      setFolders: (value: boolean) => {
        folders = value
      },
      setWide: (value: boolean) => {
        wide = value
      },
      setHold: (value: boolean) => {
        hold = value
      },
      release: () => {
        release?.()
        release = undefined
      },
      setFail: (value: boolean) => {
        fail = value
      },
      setEmpty: (value: boolean) => {
        empty = value
      }
    }
  })
  return (
    <AppContext.Provider
      value={{
        checkingSession: false,
        loggedIn: signedIn,
        needsToUpdatePassword: false,
        username: 'alice',
        displayName: 'Alice',
        isAdmin: false,
        mode: ModeType.Server,
        runTimes: [],
        authProviders: [],
        localLoginEnabled: true,
        version: '',
        authorizedRoutes: [],
        authorizedRoutesLoaded: true,
        isAuthorizedFor: () => allowed
      }}
    >
      {signedIn && <Search />}
      {/* The tree the folder search is started from: right-clicking a row here is
          the request the header's box has to answer. */}
      {signedIn && folders && (
        <TreeView
          node={treeOf()}
          expanded={[]}
          onExpandedChange={() => undefined}
          handleSelect={() => undefined}
          deleteNode={() => undefined}
          addFile={() => undefined}
          addFolder={() => undefined}
          rename={() => undefined}
        />
      )}
    </AppContext.Provider>
  )
}

createRoot(document.getElementById('root')!).render(
  <MemoryRouter initialEntries={['/studio']}>
    <Harness />
  </MemoryRouter>
)
