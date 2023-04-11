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
    >
      <span>log</span>
      {errors.length !== 0 && (
        <ErrorOutline color="error" style={{ fontSize: 20 }} />
      )}
      {warnings.length !== 0 && (
        <Warning style={{ fontSize: 20, color: 'green' }} />
      )}{' '}
    </div>
  )
}

export default LogTabWithIcons
