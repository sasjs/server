import axios from 'axios'
import { useState, useContext } from 'react'
import PropTypes from 'prop-types'

import {
  Backdrop,
  CircularProgress,
  CssBaseline,
  Box,
  TextField,
  Button,
  Divider,
  Typography,
  Stack
} from '@mui/material'
import { AppContext } from '../context/appContext'
import { demoLogins } from '../utils/demoLogin'

/**
 * The refusal the CSRF middleware sends when the token in the browser does not
 * verify. It answers with a fresh token as a cookie, so the request that
 * follows it succeeds - see `login`.
 */
const isCsrfRefusal = (error: any): boolean =>
  typeof error?.response?.data === 'string' &&
  error.response.data.includes('Invalid CSRF token')

const postLogin = (payload: { username: string; password: string }) =>
  axios.post('/SASLogon/login', payload).then((res) => res.data)

/**
 * Signs in, retrying once when the CSRF token is refused.
 *
 * The token lives in a cookie and is read by axios at request time, so the
 * retry picks up the one the refusal itself handed back. Without it a browser
 * still holding a stale XSRF-TOKEN - one left by an earlier deployment, or a
 * host-only copy beside the domain-scoped one - echoes that value on every
 * attempt and the sign-in never recovers however often the user presses
 * Submit.
 */
const login = async (payload: { username: string; password: string }) => {
  try {
    return await postLogin(payload)
  } catch (error) {
    if (!isCsrfRefusal(error)) throw error

    return await postLogin(payload)
  }
}

/**
 * Hands the browser to the server-side OIDC flow. A full navigation rather
 * than an XHR: the server answers with a redirect to the provider, which the
 * browser has to follow itself.
 */
const startSingleSignOn = () => window.location.assign('/SASLogon/openid')

const Login = () => {
  const appContext = useContext(AppContext)
  const [isLoading, setIsLoading] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  /**
   * The demonstration site's accounts, when this page states them (see
   * `demoLogins`). A real deployment carries no such meta and shows nothing.
   */
  const demos = demoLogins()

  const handleSubmit = async (e: any) => {
    setIsLoading(true)
    setErrorMessage('')
    e.preventDefault()

    const { loggedIn, user } = await login({
      username,
      password
    })
      .catch((err: any) => {
        setErrorMessage(err.response?.data || err.toString())
        return {}
      })
      .finally(() => {
        setIsLoading(false)
      })

    if (loggedIn) {
      appContext.setUserId?.(user.uid)
      appContext.setUsername?.(user.username)
      appContext.setDisplayName?.(user.displayName)
      appContext.setIsAdmin?.(user.isAdmin)
      appContext.setLoggedIn?.(loggedIn)
      appContext.setNeedsToUpdatePassword?.(user.needsToUpdatePassword)
    }
  }

  return (
    <>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={isLoading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      <Box
        className="container"
        component="form"
        onSubmit={handleSubmit}
        sx={{
          '& > :not(style)': { m: 1, width: '25ch' }
        }}
      >
        <CssBaseline />
        <br />
        <h2 style={{ width: 'auto' }}>Welcome to SASjs Server!</h2>

        {/*
          Shown only when the server reports an OIDC provider. The password
          form stays below it while the server accepts local sign-in: internal
          and LDAP users still need it, and it is the way in for a local admin
          if the provider is down.
        */}
        {appContext.oidcProviderName && (
          <Button type="button" variant="contained" onClick={startSingleSignOn}>
            Sign in with {appContext.oidcProviderName}
          </Button>
        )}

        {appContext.oidcProviderName && appContext.localLoginEnabled && (
          <Divider sx={{ width: '25ch', m: 1 }}>
            <Typography variant="caption">or</Typography>
          </Divider>
        )}

        {/*
          A deployment that authenticates everyone through a provider switches
          local sign-in off, and the server then refuses every password attempt.
          Offering the form anyway would only invite a refusal, so it is hidden.
        */}
        {appContext.localLoginEnabled && (
          <>
            {/*
              The demonstration site's accounts, listed where they are needed. It
              is a fixture rather than a directory, so there is nobody to ask; the
              list is the fixture the build shipped. A click fills the form -
              typing a demo password from a screenshot is the kind of friction
              that makes a demo feel broken.
            */}
            {demos.length > 0 && (
              <Box sx={{ width: '25ch', textAlign: 'left' }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  component="p"
                >
                  Demo credentials
                </Typography>
                <Stack spacing={0.25} sx={{ mt: 0.5, mb: 1 }}>
                  {demos.map((demo) => (
                    <Button
                      key={demo.username}
                      type="button"
                      size="small"
                      variant="text"
                      sx={{
                        justifyContent: 'flex-start',
                        textTransform: 'none'
                      }}
                      onClick={() => {
                        setUsername(demo.username)
                        setPassword(demo.password)
                      }}
                    >
                      {demo.username} / {demo.password}
                      {demo.admin ? ' (admin)' : ''}
                    </Button>
                  ))}
                </Stack>
              </Box>
            )}

            <TextField
              id="username"
              label="Username"
              type="text"
              variant="outlined"
              value={username}
              onChange={(e: any) => setUsername(e.target.value)}
              required
            />
            <TextField
              id="password"
              label="Password"
              type="password"
              variant="outlined"
              value={password}
              onChange={(e: any) => setPassword(e.target.value)}
              required
            />
            {errorMessage && <span>{errorMessage}</span>}
            <Button
              type="submit"
              variant="outlined"
              disabled={!appContext.setLoggedIn}
            >
              Submit
            </Button>
          </>
        )}

        {/*
          Unreachable through configuration - the server refuses to start when
          local sign-in is off and no provider is configured - but a login
          screen showing nothing but a title would leave the cause invisible.
        */}
        {!appContext.localLoginEnabled && !appContext.oidcProviderName && (
          <Typography variant="body2">
            This server has no sign-in method available. Ask an administrator to
            configure an authentication provider.
          </Typography>
        )}
      </Box>
    </>
  )
}

Login.propTypes = {
  getCodeOnly: PropTypes.bool
}

export default Login
