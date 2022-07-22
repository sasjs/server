import React, { useContext } from 'react'
import { Route, HashRouter, Routes } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import { theme } from './theme'

import Login from './components/login'
import Header from './components/header'
import Home from './components/home'
import Studio from './containers/Studio'
import Settings from './containers/Settings'

import { AppContext } from './context/appContext'
import AuthCode from './containers/AuthCode'
import { ToastContainer } from 'react-toastify'

function App() {
  const appContext = useContext(AppContext)

  if (!appContext.loggedIn) {
    return (
      <ThemeProvider theme={theme}>
        <HashRouter>
          <Header />
          <Routes>
            <Route path="/" element={<Login />} />
          </Routes>
        </HashRouter>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider theme={theme}>
      <HashRouter>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/SASjsStudio" element={<Studio />} />
          <Route path="/SASjsSettings" element={<Settings />} />
          <Route path="/SASjsLogon" element={<AuthCode />} />
        </Routes>
        <ToastContainer />
      </HashRouter>
    </ThemeProvider>
  )
}

export default App
