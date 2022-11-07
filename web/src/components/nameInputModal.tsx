import React, { useState, useEffect } from 'react'

import { Button, DialogActions, DialogContent, TextField } from '@mui/material'

import { BootstrapDialogTitle } from './dialogTitle'
import { BootstrapDialog } from './modal'

type NameInputModalProps = {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  title: string
  isFolder: boolean
  actionLabel: string
  action: (name: string) => void
  defaultName?: string
}

const NameInputModal = ({
  open,
  setOpen,
  title,
  isFolder,
  actionLabel,
  action,
  defaultName
}: NameInputModalProps) => {
  const [name, setName] = useState('')
  const [hasError, setHasError] = useState(false)
  const [errorText, setErrorText] = useState('')

  useEffect(() => {
    if (defaultName) setName(defaultName)
  }, [defaultName])

  const handleFocus = (
    event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement, Element>
  ) => {
    if (defaultName) {
      event.target.select()
    }
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value

    const folderNameRegex = /[`!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~]/
    const fileNameRegex = /[`!@#$%^&*()+\-=[\]{};':"\\|,<>/?~]/
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

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (hasError || !name) return
    action(name)
  }

  const handleActionClick = (event: React.MouseEvent) => {
    event.stopPropagation()
    action(name)
  }

  const handleClose = (event: any) => {
    event.stopPropagation()
    setOpen(false)
  }

  return (
    <BootstrapDialog fullWidth onClose={handleClose} open={open}>
      <BootstrapDialogTitle id="abort-modal" handleOpen={setOpen}>
        {title}
      </BootstrapDialogTitle>
      <DialogContent dividers>
        <form onSubmit={handleSubmit}>
          <TextField
            id="input-box"
            fullWidth
            autoFocus
            onFocus={handleFocus}
            variant="outlined"
            label={isFolder ? 'Folder Name' : 'File Name'}
            value={name}
            onChange={handleChange}
            error={hasError}
            helperText={errorText}
          />
        </form>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleActionClick}
          disabled={hasError || !name}
        >
          {actionLabel}
        </Button>
      </DialogActions>
    </BootstrapDialog>
  )
}

export default NameInputModal
