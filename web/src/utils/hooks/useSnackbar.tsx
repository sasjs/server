import { useCallback, useState } from 'react'
import BootstrapSnackbar, {
  AlertSeverityType,
  SnackbarAction
} from '../../components/snackbar'

/**
 * What a notice is set with, including the buttons it offers.
 *
 * A message clears the buttons unless it brings its own, so a plain report can
 * never inherit the actions of an earlier rewrite.
 */
export type SetSnackbarMessage = (
  message: string,
  actions?: SnackbarAction[],
  autoHideDuration?: number
) => void

export const useSnackbar = () => {
  const [openSnackbar, setOpenSnackbar] = useState(false)
  const [snackbarMessage, setSnackbarMessageState] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState<AlertSeverityType>(
    AlertSeverityType.Success
  )
  const [snackbarActions, setSnackbarActions] = useState<
    SnackbarAction[] | undefined
  >(undefined)
  const [snackbarDuration, setSnackbarDuration] = useState<number | undefined>(
    undefined
  )

  /**
   * Sets the notice's text, and with it the buttons it offers.
   *
   * The actions are cleared by every message, because a notice that merely
   * reports something would otherwise inherit the Review and Undo buttons of
   * the rewrite before it - buttons wired to a snapshot the user is no longer
   * looking at.
   *
   * A stable identity, because callers hold it in their own dependency lists:
   * a new function per render re-creates every `useCallback` that reports
   * through it, and re-registers the editor's actions with them.
   */
  const setSnackbarMessage = useCallback<SetSnackbarMessage>(
    (message, actions, autoHideDuration) => {
      setSnackbarMessageState(message)
      setSnackbarActions(actions)
      setSnackbarDuration(autoHideDuration)
    },
    []
  )

  const Snackbar = () => (
    <BootstrapSnackbar
      open={openSnackbar}
      setOpen={setOpenSnackbar}
      message={snackbarMessage}
      severity={snackbarSeverity}
      actions={snackbarActions}
      autoHideDuration={snackbarDuration}
    />
  )

  return { Snackbar, setOpenSnackbar, setSnackbarMessage, setSnackbarSeverity }
}
