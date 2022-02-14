import React, { useState } from 'react'
import { useLocation } from 'react-router-dom'
import PropTypes from 'prop-types'

import { CssBaseline, Box, TextField, Button, Typography } from '@mui/material'

const headers = {
  Accept: 'application/json',
  'Content-Type': 'application/json'
}
const NODE_ENV = process.env.NODE_ENV
const PORT_API = process.env.PORT_API
const baseUrl =
  NODE_ENV === 'development' ? `http://localhost:${PORT_API ?? 5000}` : ''

const getAuthCode = async (credentials: any) => {
  return fetch(`${baseUrl}/SASjsApi/auth/authorize`, {
    method: 'POST',
    headers,
    body: JSON.stringify(credentials)
  }).then(async (response) => {
    const resText = await response.text()
    if (response.status !== 200) throw resText

    return JSON.parse(resText)
  })
}
const getTokens = async (payload: any) => {
  return fetch(`${baseUrl}/SASjsApi/auth/token`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  }).then((data) => data.json())
}

const Login = ({ setTokens, getCodeOnly }: any) => {
  const location = useLocation()
  const [username, setUserName] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  let error: boolean
  const [displayCode, setDisplayCode] = useState(null)

  const handleSubmit = async (e: any) => {
    error = false
    setErrorMessage('')
    e.preventDefault()
    let clientId = process.env.CLIENT_ID

    if (getCodeOnly) {
      const params = new URLSearchParams(location.search)
      const responseType = params.get('response_type')
      if (responseType === 'code')
        clientId = params.get('client_id') ?? undefined
    }

    const { code } = await getAuthCode({
      clientId,
      username,
      password
    }).catch((err: string) => {
      error = true
      setErrorMessage(err)
      return {}
    })

    if (!error) {
      if (getCodeOnly) return setDisplayCode(code)

      const { accessToken, refreshToken } = await getTokens({
        clientId,
        code
      })

      setTokens(accessToken, refreshToken)
    }
  }

  if (displayCode) {
    return (
      <Box className="main">
        <CssBaseline />
        <br />
        <h2>Authorization Code</h2>
        <Typography m={2} p={3} style={{ overflowWrap: 'anywhere' }}>
          {displayCode}
        </Typography>

        <br />
      </Box>
    )
  }

  return (
    <Box
      className="main"
      component="form"
      onSubmit={handleSubmit}
      sx={{
        '& > :not(style)': { m: 1, width: '25ch' }
      }}
    >
      <CssBaseline />
      <br />
      <h2 style={{ width: 'auto' }}>Welcome to SASjs Server!</h2>
      {getCodeOnly && (
        <p style={{ width: 'auto' }}>
          Provide credentials to get authorization code.
        </p>
      )}
      <br />

      <TextField
        id="username"
        label="Username"
        type="text"
        variant="outlined"
        onChange={(e: any) => setUserName(e.target.value)}
        required
      />
      <TextField
        id="password"
        label="Password"
        type="password"
        variant="outlined"
        onChange={(e: any) => setPassword(e.target.value)}
        required
      />
      {errorMessage && <span>{errorMessage}</span>}
      <Button type="submit" variant="outlined">
        Submit
      </Button>
    </Box>
  )
}

Login.propTypes = {
  setTokens: PropTypes.func,
  getCodeOnly: PropTypes.bool
}

export default Login
