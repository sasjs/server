import React, { Dispatch, SetStateAction } from 'react'
import Snackbar from '@mui/material/Snackbar'
import MuiAlert, { AlertProps } from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Slide, { SlideProps } from '@mui/material/Slide'

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />
  }
)

const Transition = (props: SlideProps) => {
  return <Slide {...props} direction="up" />
}

export enum AlertSeverityType {
  Success = 'success',
  Warning = 'warning',
  Info = 'info',
  Error = 'error'
}

/**
 * A button offered inside the notice, such as Review or Undo after the buffer
 * was rewritten.
 *
 * The action closes the notice and then runs: an Undo behind a notice that is
 * still counting down invites a second click on a snapshot that has already
 * been applied or refused.
 */
export type SnackbarAction = {
  label: string
  onClick: () => void
}

type BootstrapSnackbarProps = {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  message: string
  severity: AlertSeverityType
  /** Buttons shown inside the alert. */
  actions?: SnackbarAction[]
  /**
   * How long the notice stays.
   *
   * A notice with actions is given longer than the default: three seconds is
   * enough to read "File saved!", but not to read it, decide, and reach for
   * Undo.
   */
  autoHideDuration?: number
}

const BootstrapSnackbar = ({
  open,
  setOpen,
  message,
  severity,
  actions,
  autoHideDuration
}: BootstrapSnackbarProps) => {
  const handleClose = (
    _event: React.SyntheticEvent | Event,
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
      autoHideDuration={autoHideDuration ?? 3000}
      onClose={handleClose}
      slots={{ transition: Transition }}
    >
      <Alert
        onClose={handleClose}
        severity={severity}
        sx={{ width: '100%' }}
        action={
          actions?.length ? (
            <Box
              component="span"
              sx={{ display: 'inline-flex', gap: 0.5, alignItems: 'center' }}
            >
              {actions.map((action) => (
                <Button
                  key={action.label}
                  color="inherit"
                  size="small"
                  onClick={() => {
                    setOpen(false)
                    action.onClick()
                  }}
                >
                  {action.label}
                </Button>
              ))}
            </Box>
          ) : undefined
        }
      >
        {message}
      </Alert>
    </Snackbar>
  )
}

export default BootstrapSnackbar
