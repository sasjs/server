import React, { useEffect, useState } from 'react'

import {
  Grid,
  DialogContent,
  DialogActions,
  Button,
  OutlinedInput,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  FormHelperText
} from '@mui/material'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'

import { BootstrapDialogTitle } from './dialogTitle'
import { BootstrapDialog } from './modal'

type Props = {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  title: string
  updatePassword: (currentPassword: string, newPassword: string) => void
}

const UpdatePasswordModal = (props: Props) => {
  const { open, setOpen, title, updatePassword } = props
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

  return (
    <div>
      <BootstrapDialog onClose={() => setOpen(false)} open={open}>
        <BootstrapDialogTitle id="abort-modal" handleOpen={setOpen}>
          {title}
        </BootstrapDialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <PasswordInput
                label="Current Password"
                password={currentPassword}
                setPassword={setCurrentPassword}
              />
            </Grid>
            <Grid item xs={12}>
              <PasswordInput
                label="New Password"
                password={newPassword}
                setPassword={setNewPassword}
                hasError={hasError}
                errorText={errorText}
                handleBlur={handleBlur}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => updatePassword(currentPassword, newPassword)}
            disabled={hasError || !currentPassword || !newPassword}
          >
            Update
          </Button>
        </DialogActions>
      </BootstrapDialog>
    </div>
  )
}

export default UpdatePasswordModal

type PasswordInputProps = {
  label: string
  password: string
  setPassword: React.Dispatch<React.SetStateAction<string>>
  hasError?: boolean
  errorText?: string
  handleBlur?: () => void
}

export const PasswordInput = ({
  label,
  password,
  setPassword,
  hasError,
  errorText,
  handleBlur
}: PasswordInputProps) => {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <FormControl sx={{ width: '100%' }} variant="outlined" error={hasError}>
      <InputLabel htmlFor="outlined-adornment-password">{label}</InputLabel>
      <OutlinedInput
        id="outlined-adornment-password"
        type={showPassword ? 'text' : 'password'}
        label={label}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onBlur={handleBlur}
        endAdornment={
          <InputAdornment position="end">
            <IconButton
              onClick={() => setShowPassword((val) => !val)}
              edge="end"
            >
              {showPassword ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </InputAdornment>
        }
      />
      {errorText && <FormHelperText>{errorText}</FormHelperText>}
    </FormControl>
  )
}
