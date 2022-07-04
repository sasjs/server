import React, { Dispatch, SetStateAction } from 'react'
import Snackbar from '@mui/material/Snackbar'
import MuiAlert, { AlertProps } from '@mui/material/Alert'
import Slide, { SlideProps } from '@mui/material/Slide'

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  props,
  ref
) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />
})

const Transition = (props: SlideProps) => {
  return <Slide {...props} direction="up" />
}

export enum AlertSeverityType {
  Success = 'success',
  Warning = 'warning',
  Info = 'info',
  Error = 'error'
}

type BootstrapSnackbarProps = {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  message: string
  severity: AlertSeverityType
}

const BootstrapSnackbar = ({
  open,
  setOpen,
  message,
  severity
}: BootstrapSnackbarProps) => {
  const handleClose = (
    event: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === 'clickaway') {
      return
    }

    setOpen(false)
  }

  return (
    <Snackbar
      open={open}
      autoHideDuration={3000}
      onClose={handleClose}
      TransitionComponent={Transition}
    >
      <Alert onClose={handleClose} severity={severity} sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  )
}

export default BootstrapSnackbar
