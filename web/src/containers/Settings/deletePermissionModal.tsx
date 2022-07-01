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

type DeleteModalProps = {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  deletePermission: () => void
}

const DeleteModal = ({ open, setOpen, deletePermission }: DeleteModalProps) => {
  return (
    <BootstrapDialog onClose={() => setOpen(false)} open={open}>
      <DialogContent dividers>
        <Typography gutterBottom>
          Are you sure you want to delete this permission?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button color="error" onClick={() => deletePermission()}>
          Delete
        </Button>
      </DialogActions>
    </BootstrapDialog>
  )
}

export default DeleteModal
