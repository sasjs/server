import React, { useState, useEffect, useContext } from 'react'
import axios from 'axios'
import { Box, CssBaseline, Button, CircularProgress } from '@mui/material'
import { toast } from 'react-toastify'
import { PasswordInput } from './passwordModal'

import { AppContext } from '../context/appContext'

const UpdatePassword = () => {
  const appContext = useContext(AppContext)
  const [isLoading, setIsLoading] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [hasError, setHasError] = useState(false)
  const [errorText, setErrorText] = useState('')

  useEffect(() => {
    if (
      currentPassword.length > 0 &&
      newPassword.length > 0 &&
      newPassword === currentPassword
    ) {
      setErrorText('New password should be different to current password.')
      setHasError(true)
    } else if (newPassword.length >= 6) {
      setErrorText('')
      setHasError(false)
    }
  }, [currentPassword, newPassword])

  const handleBlur = () => {
    if (newPassword.length < 6) {
      setErrorText('Password length should be at least 6 characters.')
      setHasError(true)
    }
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    if (hasError || !currentPassword || !newPassword) return

    setIsLoading(true)
    axios
      .patch(`/SASjsApi/auth/updatePassword`, {
        currentPassword,
        newPassword
      })
      .then((res: any) => {
        appContext.setNeedsToUpdatePassword?.(false)
        toast.success('Password updated', {
          theme: 'dark',
          position: toast.POSITION.BOTTOM_RIGHT
        })
      })
      .catch((err) => {
        toast.error('Failed: ' + err.response?.data || err.text, {
          theme: 'dark',
          position: toast.POSITION.BOTTOM_RIGHT
        })
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  return isLoading ? (
    <CircularProgress
      style={{ position: 'absolute', left: '50%', top: '50%' }}
    />
  ) : (
    <Box
      className="main"
      component="form"
      onSubmit={handleSubmit}
      sx={{
        '& > :not(style)': { m: 1, width: '25ch' }
      }}
    >
      <CssBaseline />
      <h2>Welcome to SASjs Server!</h2>
      <p style={{ width: 'auto' }}>
        This is your first time login to SASjs server. Therefore, you need to
        update your password.
      </p>
      <PasswordInput
        label="Current Password"
        password={currentPassword}
        setPassword={setCurrentPassword}
      />
      <PasswordInput
        label="New Password"
        password={newPassword}
        setPassword={setNewPassword}
        hasError={hasError}
        errorText={errorText}
        handleBlur={handleBlur}
      />
      <Button
        type="submit"
        variant="outlined"
        disabled={hasError || !currentPassword || !newPassword}
      >
        Update
      </Button>
    </Box>
  )
}

export default UpdatePassword
