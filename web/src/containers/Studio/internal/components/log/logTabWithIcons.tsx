import { ErrorOutline, Warning } from '@mui/icons-material'
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
}

const LogTabWithIcons = (props: LogTabProps) => {
  const { errors, warnings, body } = props.log

  return (
    <div className={classes.TabContainer}>
      <span>log</span>
      {errors && errors.length !== 0 && (
        <ErrorOutline color="error" className={classes.Icon} />
      )}
      {warnings && warnings.length !== 0 && (
        <Warning className={[classes.Icon, classes.GreenIcon].join(' ')} />
      )}
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
