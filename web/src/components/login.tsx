import axios from 'axios'
import React, { useState, useContext } from 'react'
import PropTypes from 'prop-types'

import {
  Backdrop,
  CircularProgress,
  CssBaseline,
  Box,
  TextField,
  Button
} from '@mui/material'
import { AppContext } from '../context/appContext'

const login = async (payload: { username: string; password: string }) =>
  axios.post('/SASLogon/login', payload).then((res) => res.data)

const Login = () => {
  const appContext = useContext(AppContext)
  const [isLoading, setIsLoading] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

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
      appContext.setUserId?.(user.id)
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
    </>
  )
}

Login.propTypes = {
  getCodeOnly: PropTypes.bool
}

export default Login
