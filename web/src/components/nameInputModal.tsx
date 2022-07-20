import React, { useState } from 'react'

import { Button, DialogActions, DialogContent, TextField } from '@mui/material'

import { BootstrapDialogTitle } from './dialogTitle'
import { BootstrapDialog } from './modal'

type NameInputModalProps = {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  isFolder: boolean
  add: (name: string) => void
}

const NameInputModal = ({
  open,
  setOpen,
  isFolder,
  add
}: NameInputModalProps) => {
  const [name, setName] = useState('')
  const [hasError, setHasError] = useState(false)
  const [errorText, setErrorText] = useState('')

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value

    const folderNameRegex = /[`!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~]/
    const fileNameRegex = /[`!@#$%^&*()_+\-=[\]{};':"\\|,<>/?~]/
    const fileNameExtensionRegex = /.(exe|sh|htaccess)$/i

    const specialChars = isFolder ? folderNameRegex : fileNameRegex

    if (specialChars.test(value)) {
      setHasError(true)
      setErrorText('can not have special characters')
    } else if (!isFolder && fileNameExtensionRegex.test(value)) {
      setHasError(true)
      setErrorText('can not add file with extensions [exe, sh, htaccess]')
    } else {
      setHasError(false)
      setErrorText('')
    }

    setName(value)
  }

  return (
    <BootstrapDialog fullWidth onClose={() => setOpen(false)} open={open}>
      <BootstrapDialogTitle id="abort-modal" handleOpen={setOpen}>
        {isFolder ? 'Add Folder' : 'Add File'}
      </BootstrapDialogTitle>
      <DialogContent dividers>
        <TextField
          fullWidth
          variant="outlined"
          label={isFolder ? 'Folder Name' : 'File Name'}
          value={name}
          onChange={handleChange}
          error={hasError}
          helperText={errorText}
        />
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => {
            add(name)
          }}
          disabled={hasError || !name}
        >
          Add
        </Button>
      </DialogActions>
    </BootstrapDialog>
  )
}

export default NameInputModal
