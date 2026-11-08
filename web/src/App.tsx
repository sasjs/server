import React, { useContext, useEffect } from 'react'
import { Route, BrowserRouter, Routes, Navigate } from 'react-router-dom'
import { ThemeProvider, useColorScheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { theme } from './theme'

import Login from './components/login'
import Header from './components/header'
import Home from './components/home'
import Studio from './containers/Studio'
import Settings from './containers/Settings'
import ApiDocs from './containers/ApiDocs'
import Docs from './containers/Docs'
import UpdatePassword from './components/updatePassword'
import BuildStamp from './components/buildStamp'

import { AppContext } from './context/appContext'
import AuthCode from './containers/AuthCode'
import { ToastContainer } from 'react-toastify'
import { STUDIO_ROUTE } from './utils'
import { useColorMode } from './utils/hooks'

/**
 * Keeps MUI's colour scheme in step with the stored preference.
 *
 * One theme carries both schemes and MUI applies the one it is told to, so the
 * app's setting has to be pushed into it rather than used to build a theme.
 * `useColorScheme` reads the provider's context, which is why this sits inside
 * it; it renders nothing.
 */
const ColorSchemeSync = () => {
  const [mode] = useColorMode()
  const { mode: applied, setMode } = useColorScheme()

  useEffect(() => {
    if (applied !== mode) setMode(mode)
  }, [applied, mode, setMode])

  return null
}

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

  // One provider, one scheme sync, one baseline for every route: the three
  // branches below differ only in which screen they show.
  const content = !appContext.loggedIn ? (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    </BrowserRouter>
  ) : appContext.needsToUpdatePassword ? (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="*" element={<UpdatePassword />} />
      </Routes>
      <ToastContainer />
    </BrowserRouter>
  ) : (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/SASjsStudio" element={studioElement} />
        <Route path="/SASjsApiDocs" element={<ApiDocs />} />
        <Route path="/SASjsDocs" element={<Docs />} />
        <Route path="/SASjsSettings" element={<Settings />} />
        <Route path="/SASjsLogon" element={<AuthCode />} />
        {/* The server answers any unmatched path with the app shell, so a
            mistyped URL would otherwise render an empty screen. */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer />
    </BrowserRouter>
  )

  return (
    <ThemeProvider theme={theme} noSsr>
      <ColorSchemeSync />
      {/* the page around the app must take the scheme too, or a dark screen
          sits in a white document */}
      <CssBaseline />
      {content}
      <BuildStamp />
    </ThemeProvider>
  )
}

export default App
