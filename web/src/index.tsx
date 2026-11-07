import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import AppContextProvider from './context/appContext'
import { apiBaseUrl } from './utils/apiBaseUrl'

import axios from 'axios'

/**
 * Links built before the interface used real paths put the route in the
 * fragment - `/#/SASjsStudio`, and the CLI's `/#/SASjsLogon?client_id=...` for
 * the authorization code flow. A fragment never reaches the server, so those
 * URLs still load the app shell; move the route into the path before anything
 * reads it, and an existing bookmark or an older CLI keeps working.
 */
const legacyRoute = window.location.hash
if (legacyRoute.startsWith('#/')) {
  const [legacyPath, legacyQuery] = legacyRoute.slice(1).split('?')
  window.history.replaceState(
    null,
    '',
    legacyPath + (legacyQuery ? `?${legacyQuery}` : '')
  )
}

// The interface's screens are real paths now, so the base URL is the origin and
// not the origin plus the current path - the path is the route. apiBaseUrl is
// the one place that decides it, in development and in a deployment.
axios.defaults = Object.assign(axios.defaults, {
  withCredentials: true,
  baseURL: apiBaseUrl
})

const container = document.getElementById('root') as HTMLElement

createRoot(container).render(
  <React.StrictMode>
    <AppContextProvider>
      <App />
    </AppContextProvider>
  </React.StrictMode>
)
