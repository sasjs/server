import React, { useState } from 'react'
import PropTypes from 'prop-types'

import { CssBaseline, Box, TextField, Button } from '@mui/material'

const getAuthCode = async (credentials: any) => {
  return fetch('/SASjsApi/auth/authorize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(credentials)
  }).then((data) => data.json())
}
const getTokens = async (payload: any) => {
  return fetch('/SASjsApi/auth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  }).then((data) => data.json())
}

const Login = ({ setTokens }: any) => {
  const [clientId, setClientId] = useState()
  const [username, setUserName] = useState()
  const [password, setPassword] = useState()

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    const { code } = await getAuthCode({
      clientId,
      username,
      password
    })

    const { accessToken, refreshToken } = await getTokens({
      clientId,
      code
    })

    setTokens(accessToken, refreshToken)
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
      <h2>Welcome to SASjs Server!</h2>
      <br />

      <TextField
        id="client-id"
        label="Client ID"
        type="text"
        variant="outlined"
        onChange={(e: any) => setClientId(e.target.value)}
        autoFocus
        required
      />
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
      <Button type="submit" variant="outlined">
        Submit
      </Button>
    </Box>
  )
}

Login.propTypes = {
  setTokens: PropTypes.func.isRequired
}

export default Login
