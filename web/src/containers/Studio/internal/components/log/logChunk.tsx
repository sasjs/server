import { useState, useEffect, SyntheticEvent } from 'react'
import { Typography } from '@mui/material'
import Highlight from 'react-highlight'
import { ErrorOutline, Warning } from '@mui/icons-material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import CheckIcon from '@mui/icons-material/Check'
import { makeStyles } from '@mui/styles'
import {
  defaultChunkSize,
  parseErrorsAndWarnings,
  LogInstance,
  clearErrorsAndWarningsHtmlWrapping
} from '../../../../../utils'

const useStyles: any = makeStyles((theme: any) => ({
  expansionDescription: {
    backgroundColor: '#fbfbfb',
    border: '1px solid #e2e2e2',
    borderRadius: '3px',
    minHeight: '50px',
    padding: '10px',
    boxSizing: 'border-box',
    whiteSpace: 'pre-wrap',
    fontFamily: 'Monaco, Courier, monospace',
    position: 'relative',
    width: '100%',
    [theme.breakpoints.down('sm')]: {
      fontSize: theme.typography.pxToRem(12)
    },
    [theme.breakpoints.up('md')]: {
      fontSize: theme.typography.pxToRem(16)
    }
  }
}))

interface LogChunkProps {
  id: number
  text: string
  expanded: boolean
  logLineCount: number
  onClick: (evt: any, id: number) => void
  scrollToLogInstance?: LogInstance
}

const LogChunk = (props: LogChunkProps) => {
  const { id, text, logLineCount, scrollToLogInstance } = props
  const classes = useStyles()
  const [expanded, setExpanded] = useState(props.expanded)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setExpanded(props.expanded)
  }, [props.expanded])

  useEffect(() => {
    if (expanded && scrollToLogInstance) {
      const { type, id } = scrollToLogInstance
      const line = document.getElementById(`${type}_${id}`)
      const logWrapper: HTMLDivElement | null =
        document.querySelector(`#logWrapper`)
      const logContainer: HTMLHeadElement | null =
        document.querySelector(`#log_container`)

      if (line && logWrapper && logContainer) {
        const initialColor = line.style.color

        line.style.backgroundColor = '#f6e30599'

        line.scrollIntoView({ behavior: 'smooth', block: 'start' })

        setTimeout(() => {
          line.setAttribute('style', `color: ${initialColor};`)
        }, 3000)
      }
    }
  }, [expanded, scrollToLogInstance])

  const { errors, warnings } = parseErrorsAndWarnings(text)

  return (
    <div onClick={(evt) => props.onClick(evt, id)}>
      <button
        style={{
          color: '#444',
          cursor: 'pointer',
          padding: '18px',
          width: '100%',
          textAlign: 'left',
          border: 'none',
          outline: 'none',
          transition: '0.4s',
          boxShadow:
            'rgba(0, 0, 0, 0.2) 0px 2px 1px -1px, rgba(0, 0, 0, 0.14) 0px 1px 1px 0px, rgba(0, 0, 0, 0.12) 0px 1px 3px 0px'
        }}
      >
        <Typography variant="subtitle1">
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: 6,
              alignItems: 'center'
            }}
          >
            <span>{`Lines: ${id * defaultChunkSize} ... ${
              (id + 1) * defaultChunkSize < logLineCount
                ? (id + 1) * defaultChunkSize
                : logLineCount
            }`}</span>
            {copied ? (
              <CheckIcon style={{ fontSize: 20, color: 'green' }} />
            ) : (
              <ContentCopyIcon
                style={{ fontSize: 20 }}
                onClick={(evt: SyntheticEvent) => {
                  evt.stopPropagation()

                  navigator.clipboard.writeText(
                    clearErrorsAndWarningsHtmlWrapping(text)
                  )

                  setCopied(true)

                  setTimeout(() => {
                    setCopied(false)
                  }, 1000)
                }}
              />
            )}
            {errors && errors.length !== 0 && (
              <ErrorOutline color="error" style={{ fontSize: 20 }} />
            )}
            {warnings && warnings.length !== 0 && (
              <Warning style={{ fontSize: 20, color: 'green' }} />
            )}{' '}
            <ExpandMoreIcon
              style={{
                marginLeft: 'auto',
                transform: expanded ? 'rotate(180deg)' : 'unset'
              }}
            />
          </div>
        </Typography>
      </button>
      <div
        style={{
          backgroundColor: 'white',
          display: expanded ? 'block' : 'none',
          overflow: 'hidden'
        }}
      >
        <div id={`log_container`} className={classes.expansionDescription}>
          <Highlight className={'html'} innerHTML={true}>
            {expanded ? text : ''}
          </Highlight>
        </div>
      </div>
    </div>
  )
}

export default LogChunk
