import React, { useContext } from 'react'
import { Route, BrowserRouter, Routes, Navigate } from 'react-router-dom'
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

  /**
   * The Studio screen, or the refusal that stands in for it.
   *
   * The tab is hidden for a caller the server would refuse, but the URL is
   * still a way in - so the route refuses too, and lands on Home rather than on
   * an editor whose Run button cannot work.
   *
   * The answer is only known once the server has given it: an empty list means
   * "not permitted", but also "not asked yet", and treating the second of those
   * as a refusal would bounce a deep link or a refresh to Home before the
   * request came back.
   */
  const studioElement = (() => {
    if (!appContext.authorizedRoutesLoaded) return null

    return appContext.isAuthorizedFor(STUDIO_ROUTE) ? (
      <Studio />
    ) : (
      <Navigate to="/" replace />
    )
  })()

  if (!appContext.loggedIn) {
    return (
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <Header />
          <Routes>
            <Route path="*" element={<Login />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    )
  }

  if (appContext.needsToUpdatePassword) {
    return (
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <Header />
          <Routes>
            <Route path="*" element={<UpdatePassword />} />
          </Routes>
          <ToastContainer />
        </BrowserRouter>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/SASjsStudio" element={studioElement} />
          <Route path="/SASjsSettings" element={<Settings />} />
          <Route path="/SASjsLogon" element={<AuthCode />} />
        </Routes>
        <ToastContainer />
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
