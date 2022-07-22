import React from 'react'

import {
  Button,
  Dialog,
  DialogContent,
  DialogActions,
  Typography
} from '@mui/material'
import { styled } from '@mui/material/styles'

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialogContent-root': {
    padding: theme.spacing(2)
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(1)
  }
}))

type DeleteConfirmationModalProps = {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  message: string
  _delete: () => void
}

const DeleteConfirmationModal = ({
  open,
  setOpen,
  message,
  _delete
}: DeleteConfirmationModalProps) => {
  return (
    <BootstrapDialog onClose={() => setOpen(false)} open={open}>
      <DialogContent dividers>
        <Typography gutterBottom>{message}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpen(false)}>Cancel</Button>
        <Button color="error" onClick={() => _delete()}>
          Delete
        </Button>
      </DialogActions>
    </BootstrapDialog>
  )
}

export default DeleteConfirmationModal
