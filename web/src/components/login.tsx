import axios from 'axios'
import React, { useState, useContext } from 'react'
import { useLocation } from 'react-router-dom'
import PropTypes from 'prop-types'

import { CssBaseline, Box, TextField, Button, Typography } from '@mui/material'
import { AppContext } from '../context/appContext'

const getAuthCode = async (credentials: any) =>
  axios.post('/SASjsApi/auth/authorize', credentials).then((res) => res.data)

const login = async (payload: { username: string; password: string }) =>
  axios
    .get('/form')
    .then((res1) =>
      axios
        .post('/login', payload, {
          headers: { 'csrf-token': res1.data.csrfToken }
        })
        .then((res2) => res2.data)
    )

const Login = ({ getCodeOnly }: any) => {
  const location = useLocation()
  const appContext = useContext(AppContext)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  let error: boolean
  const [displayCode, setDisplayCode] = useState(null)

  const handleSubmit = async (e: any) => {
    error = false
    setErrorMessage('')
    e.preventDefault()

    if (getCodeOnly) {
      const params = new URLSearchParams(location.search)
      const responseType = params.get('response_type')
      if (responseType === 'code') {
        const clientId = params.get('client_id')

        const { code } = await getAuthCode({
          clientId,
          username,
          password
        }).catch((err: any) => {
          error = true
          setErrorMessage(err.response.data)
          return {}
        })
        if (!error) return setDisplayCode(code)
        return
      }
    }

    const { loggedIn, user } = await login({
      username,
      password
    }).catch((err: any) => {
      error = true
      setErrorMessage(err.response.data)
      return {}
    })

    if (loggedIn) {
      appContext.setLoggedIn?.(loggedIn)
      appContext.setUsername?.(user.username)
      appContext.setDisplayName?.(user.displayName)
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
        onChange={(e: any) => setUsername(e.target.value)}
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
      <Button
        type="submit"
        variant="outlined"
        disabled={!appContext.setLoggedIn}
      >
        Submit
      </Button>
    </Box>
  )
}

Login.propTypes = {
  getCodeOnly: PropTypes.bool
}

export default Login
