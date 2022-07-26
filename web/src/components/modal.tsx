import React from 'react'

import { Typography, Dialog, DialogContent } from '@mui/material'
import { styled } from '@mui/material/styles'

import { BootstrapDialogTitle } from './dialogTitle'

export const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialogContent-root': {
    padding: theme.spacing(2)
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(1)
  }
}))

type ModalProps = {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  title: string
  payload: string
}

const Modal = (props: ModalProps) => {
  const { open, setOpen, title, payload } = props

  return (
    <div>
      <BootstrapDialog onClose={() => setOpen(false)} open={open}>
        <BootstrapDialogTitle id="abort-modal" handleOpen={setOpen}>
          {title}
        </BootstrapDialogTitle>
        <DialogContent dividers>
          <Typography gutterBottom>
            <span style={{ fontFamily: 'monospace' }}>{payload}</span>
          </Typography>
        </DialogContent>
      </BootstrapDialog>
    </div>
  )
}

export default Modal
