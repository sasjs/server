import React, { useState } from 'react'

import { Button, DialogActions, DialogContent, TextField } from '@mui/material'

import { BootstrapDialogTitle } from './dialogTitle'
import { BootstrapDialog } from './modal'

type FilePathInputModalProps = {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  saveFile: (filePath: string) => void
}

const FilePathInputModal = ({
  open,
  setOpen,
  saveFile
}: FilePathInputModalProps) => {
  const [filePath, setFilePath] = useState('')
  const [hasError, setHasError] = useState(false)
  const [errorText, setErrorText] = useState('')

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value

    const specialChars = /[`!@#$%^&*()+\-=[\]{};':"\\|,<>?~]/
    const fileExtension = /\.(exe|sh|htaccess)$/i

    if (specialChars.test(value)) {
      setHasError(true)
      setErrorText('can not have special characters')
    } else if (fileExtension.test(value)) {
      setHasError(true)
      setErrorText('can not save file with extensions [exe, sh, htaccess]')
    } else {
      setHasError(false)
      setErrorText('')
    }
    setFilePath(value)
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (hasError || !filePath) return
    saveFile(filePath)
  }

  return (
    <BootstrapDialog fullWidth onClose={() => setOpen(false)} open={open}>
      <BootstrapDialogTitle id="abort-modal" handleOpen={setOpen}>
        Save File
      </BootstrapDialogTitle>
      <DialogContent dividers>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            autoFocus
            variant="outlined"
            label="File Path"
            value={filePath}
            onChange={handleChange}
            error={hasError}
            helperText={errorText}
          />
        </form>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => saveFile(filePath)}
          disabled={hasError || !filePath}
        >
          Save
        </Button>
      </DialogActions>
    </BootstrapDialog>
  )
}

export default FilePathInputModal
