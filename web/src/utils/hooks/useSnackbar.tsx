import { useState } from 'react'
import BootstrapSnackbar, { AlertSeverityType } from '../../components/snackbar'

export const useSnackbar = () => {
  const [openSnackbar, setOpenSnackbar] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState<AlertSeverityType>(
    AlertSeverityType.Success
  )

  const Snackbar = () => (
    <BootstrapSnackbar
      open={openSnackbar}
      setOpen={setOpenSnackbar}
      message={snackbarMessage}
      severity={snackbarSeverity}
    />
  )

  return { Snackbar, setOpenSnackbar, setSnackbarMessage, setSnackbarSeverity }
}
