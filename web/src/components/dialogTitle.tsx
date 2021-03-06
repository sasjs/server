import React, { Dispatch, SetStateAction } from 'react'

import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'

export interface DialogTitleProps {
  id: string
  children?: React.ReactNode
  handleOpen: Dispatch<SetStateAction<boolean>>
}

export const BootstrapDialogTitle = (props: DialogTitleProps) => {
  const { children, handleOpen, ...other } = props

  return (
    <DialogTitle sx={{ m: 0, p: 2 }} {...other}>
      {children}
      {handleOpen ? (
        <IconButton
          aria-label="close"
          onClick={() => handleOpen(false)}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500]
          }}
        >
          <CloseIcon />
        </IconButton>
      ) : null}
    </DialogTitle>
  )
}
