import React, { Suspense, useContext, useEffect } from 'react'
import { Route, BrowserRouter, Routes, Navigate } from 'react-router-dom'
import { ThemeProvider, useColorScheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import { theme } from './theme'

import Login from './components/login'
import Header from './components/header'
import Home from './containers/Home'
import Apps from './containers/Apps'
/**
 * Studio is the only screen that carries an editor.
 *
 * Its bundle includes Monaco and the SAS language server - a worker asset of
 * some 26 MB - and a static import put all of that on every route: the home,
 * the Apps screen and Settings were each half a minute of download for a screen
 * that shows no editor at all. Loaded on demand, Studio pays for itself and the
 * rest of the interface does not.
 */
const Studio = React.lazy(() => import('./containers/Studio'))
import Settings from './containers/Settings'
import Docs from './containers/Docs'
import ApiDocs from './containers/ApiDocs'
import UpdatePassword from './components/updatePassword'
import BuildStamp from './components/buildStamp'
import ErrorBoundary from './components/errorBoundary'

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
      // The fallback is not null: the chunk carries the 26 MB language server,
      // so the wait is long enough to need saying, and a blank pane reads as a
      // broken route. The boundary catches the other half of the same story - a
      // chunk that fails to load - which would otherwise blank the route with no
      // message and no way to retry.
      <ErrorBoundary>
        <Suspense
          fallback={
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                minHeight: 240
              }}
            >
              <CircularProgress aria-label="Loading the editor" />
            </Box>
          }
        >
          <Studio />
        </Suspense>
      </ErrorBoundary>
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
        <Route path="/apps" element={<Apps />} />
        <Route path="/studio" element={studioElement} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/logon" element={<AuthCode />} />
        {/* The documentation and the API reference are screens like any other:
            the header stays, and the address bar carries the page being read
            inside them, so a reload or a bookmark lands on it. */}
        <Route path="/docs/*" element={<Docs />} />
        <Route path="/api" element={<ApiDocs />} />
        {/* The paths before the interface had short URLs. The server redirects
            them, but the browser-hosted build has no server to redirect, and a
            bookmark should not lose the app. The elements are repeated rather
            than redirected to, so a deep link keeps its query string -
            `/SASjsStudio?filePath=...` is how a file is opened. */}
        <Route path="/SASjsApps" element={<Apps />} />
        <Route path="/SASjsStudio" element={studioElement} />
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
