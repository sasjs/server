import React, { useContext } from 'react'
import { Route, HashRouter, Routes, Navigate } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import { theme } from './theme'

import Login from './components/login'
import Header from './components/header'
import Home from './components/home'
import Studio from './containers/Studio'
import Settings from './containers/Settings'
import UpdatePassword from './components/updatePassword'

import { AppContext } from './context/appContext'
import AuthCode from './containers/AuthCode'
import { ToastContainer } from 'react-toastify'
import { STUDIO_ROUTE } from './utils'

function App() {
  const appContext = useContext(AppContext)

  if (!appContext.loggedIn) {
    return (
      <ThemeProvider theme={theme}>
        <HashRouter>
          <Header />
          <Routes>
            <Route path="*" element={<Login />} />
          </Routes>
        </HashRouter>
      </ThemeProvider>
    )
  }

  if (appContext.needsToUpdatePassword) {
    return (
      <ThemeProvider theme={theme}>
        <HashRouter>
          <Header />
          <Routes>
            <Route path="*" element={<UpdatePassword />} />
          </Routes>
          <ToastContainer />
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
          <Route
            path="/SASjsStudio"
            element={
              // The tab is hidden for a caller the server would refuse, but the
              // URL is still a way in - so the route refuses too, and lands on
              // Home rather than on an editor whose Run button cannot work.
              appContext.isAuthorizedFor(STUDIO_ROUTE) ? (
                <Studio />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route path="/SASjsSettings" element={<Settings />} />
          <Route path="/SASjsLogon" element={<AuthCode />} />
        </Routes>
        <ToastContainer />
      </HashRouter>
    </ThemeProvider>
  )
}

export default App
