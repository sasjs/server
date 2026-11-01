import {
  ErrorOutlined,
  Visibility,
  VisibilityOff,
  Warning
} from '@mui/icons-material'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import {
  LogObject,
  download,
  clearErrorsAndWarningsHtmlWrapping
} from '../../../../../utils'
import Tooltip from '@mui/material/Tooltip'
import classes from './log.module.css'

interface LogTabProps {
  log: LogObject
  /** Whether the notable notes are listed, and the switch that changes it. */
  notesListed: boolean
  onToggleNotes: () => void
}

const LogTabWithIcons = (props: LogTabProps) => {
  const { errors, warnings, notes, body } = props.log
  const { notesListed, onToggleNotes } = props

  return (
    <div className={classes.TabContainer}>
      <span>log</span>
      {errors && errors.length !== 0 && (
        <ErrorOutlined color="error" className={classes.Icon} />
      )}
      {warnings && warnings.length !== 0 && (
        <Warning className={[classes.Icon, classes.GreenIcon].join(' ')} />
      )}
      <Tooltip
        title={notesListed ? 'Hide notable notes' : 'Show notable notes'}
        onClick={(evt) => {
          // The tab is a button: without this the click also switches tabs.
          evt.stopPropagation()
          onToggleNotes()
        }}
      >
        {notesListed ? (
          <VisibilityOff
            fontSize="small"
            className={classes.Icon}
            aria-label="Hide notable notes"
          />
        ) : (
          <Visibility
            fontSize="small"
            className={[classes.Icon, classes.GreenIcon].join(' ')}
            aria-label="Show notable notes"
          />
        )}
      </Tooltip>
      <Tooltip
        title="Download entire log"
        onClick={(evt) => {
          download(evt, clearErrorsAndWarningsHtmlWrapping(body))
        }}
      >
        <FileDownloadIcon
          className={[classes.Icon, classes.TabDownloadIcon].join(' ')}
        />
      </Tooltip>
    </div>
  )
}

export default LogTabWithIcons
