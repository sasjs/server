import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import axios from 'axios'
import Search from '../../src/components/search'
import { AppContext, ModeType } from '../../src/context/appContext'

const requests: string[] = []
let release: (() => void) | undefined
let hold = false
let fail = false

axios.defaults.adapter = async (config) => {
  const url = config.url ?? ''
  requests.push(
    url === '/SASjsApi/drive/fileTree'
      ? `${url}:${config.params?._folderPath}`
      : url
  )
  if (url === '/SASjsApi/drive/fileTree') {
    if (hold)
      await new Promise<void>((resolve) => {
        release = resolve
      })
    if (fail) throw new Error('unreadable')
    return {
      config,
      status: 200,
      statusText: 'OK',
      headers: {},
      data: {
        status: 'success',
        tree: {
          children: [{ relativePath: '/reports/orders.sas', isFolder: false }]
        }
      }
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
      setHold: (value: boolean) => {
        hold = value
      },
      release: () => {
        release?.()
        release = undefined
      },
      setFail: (value: boolean) => {
        fail = value
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
    </AppContext.Provider>
  )
}

createRoot(document.getElementById('root')!).render(
  <MemoryRouter initialEntries={['/studio']}>
    <Harness />
  </MemoryRouter>
)
