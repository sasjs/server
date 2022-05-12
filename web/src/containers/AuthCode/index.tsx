import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

import { CssBaseline, Box, Typography } from '@mui/material'

const getAuthCode = async (credentials: any) =>
  axios.post('/SASLogon/authorize', credentials).then((res) => res.data)

const AuthCode = () => {
  const location = useLocation()
  const [displayCode, setDisplayCode] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    requestAuthCode()
  }, [])

  const requestAuthCode = async () => {
    setErrorMessage('')

    const params = new URLSearchParams(location.search)

    const responseType = params.get('response_type')
    if (responseType !== 'code')
      return setErrorMessage('response type is not support')

    const clientId = params.get('client_id')
    if (!clientId) return setErrorMessage('clientId is not provided')

    setErrorMessage('Fetching auth code... ')
    const { code } = await getAuthCode({
      clientId
    })
      .then((res) => {
        setErrorMessage('')
        return res
      })
      .catch((err: any) => {
        setErrorMessage(err.response.data)
        return { code: null }
      })
    return setDisplayCode(code)
  }

  return (
    <Box className="main">
      <CssBaseline />
      <br />
      <h2>Authorization Code</h2>
      {displayCode && (
        <Typography m={2} p={3} style={{ overflowWrap: 'anywhere' }}>
          {displayCode}
        </Typography>
      )}
      {errorMessage && <Typography>{errorMessage}</Typography>}

      <br />
    </Box>
  )
}

export default AuthCode
