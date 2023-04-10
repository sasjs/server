import { ErrorOutline, Warning } from '@mui/icons-material'
import { LogObject } from '../../../../../utils'

interface LogTabProps {
  log: LogObject
}

const LogTabWithIcons = (props: LogTabProps) => {
  const { errors, warnings } = props.log

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap: 6,
        alignItems: 'center'
      }}
      onClick={() => {
        const logWrapper = document.querySelector(`#logWrapper`)

        if (logWrapper) logWrapper.scrollTop = 0
      }}
    >
      <span>log</span>
      {errors.length && <ErrorOutline color="error" style={{ fontSize: 20 }} />}
      {warnings.length && <Warning style={{ fontSize: 20 }} />}{' '}
    </div>
  )
}

export default LogTabWithIcons
