import axios from 'axios'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import React, { useEffect, useState } from 'react'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useLocation } from 'react-router-dom'

import { CssBaseline, Box, Typography, Button } from '@mui/material'

const getAuthCode = async (credentials: any) =>
  axios.post('/SASLogon/authorize', credentials).then((res) => res.data)

const AuthCode = () => {
  const location = useLocation()
  const [displayCode, setDisplayCode] = useState('')
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

      <CopyToClipboard
        text={displayCode}
        onCopy={() =>
          toast.info('Code copied to ClipBoard', {
            theme: 'dark',
            position: toast.POSITION.BOTTOM_RIGHT
          })
        }
      >
        <Button variant="contained">Copy to Clipboard</Button>
      </CopyToClipboard>

      <ToastContainer />
    </Box>
  )
}

export default AuthCode
