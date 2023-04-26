import { ErrorOutline, Warning } from '@mui/icons-material'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import {
  LogObject,
  download,
  clearErrorsAndWarningsHtmlWrapping
} from '../../../../../utils'
import Tooltip from '@mui/material/Tooltip'

interface LogTabProps {
  log: LogObject
}

const LogTabWithIcons = (props: LogTabProps) => {
  const { errors, warnings, body } = props.log

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap: 6,
        alignItems: 'center'
      }}
    >
      <span>log</span>
      {errors && errors.length !== 0 && (
        <ErrorOutline color="error" style={{ fontSize: 20 }} />
      )}
      {warnings && warnings.length !== 0 && (
        <Warning style={{ fontSize: 20, color: 'green' }} />
      )}{' '}
      <Tooltip
        title="Download entire log"
        onClick={(evt) => {
          download(evt, clearErrorsAndWarningsHtmlWrapping(body))
        }}
      >
        <FileDownloadIcon style={{ fontSize: 20, marginLeft: 20 }} />
      </Tooltip>
    </div>
  )
}

export default LogTabWithIcons
