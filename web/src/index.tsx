import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import AppContextProvider from './context/appContext'

import axios from 'axios'

const NODE_ENV = process.env.NODE_ENV
const PORT_API = process.env.PORT_API
const baseUrl =
  NODE_ENV === 'development'
    ? `http://localhost:${PORT_API ?? 5000}`
    : window.location.origin + window.location.pathname

axios.defaults = Object.assign(axios.defaults, {
  withCredentials: true,
  baseURL: baseUrl
})

const container = document.getElementById('root') as HTMLElement

createRoot(container).render(
  <React.StrictMode>
    <AppContextProvider>
      <App />
    </AppContextProvider>
  </React.StrictMode>
)
