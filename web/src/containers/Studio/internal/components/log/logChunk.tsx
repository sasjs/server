import { useState, useEffect, SyntheticEvent } from 'react'
import { Typography } from '@mui/material'
import Highlight from 'react-highlight'
import { ErrorOutline, Warning } from '@mui/icons-material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import CheckIcon from '@mui/icons-material/Check'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import {
  defaultChunkSize,
  parseErrorsAndWarnings,
  LogInstance,
  clearErrorsAndWarningsHtmlWrapping,
  download
} from '../../../../../utils'
import { logStyles } from './logComponent'
import classes from './log.module.css'

interface LogChunkProps {
  id: number
  text: string
  expanded: boolean
  logLineCount: number
  onClick: (evt: any, id: number) => void
  scrollToLogInstance?: LogInstance
  updated: number
}

const LogChunk = (props: LogChunkProps) => {
  const { id, text, logLineCount } = props
  const [scrollToLogInstance, setScrollToLogInstance] = useState(
    props.scrollToLogInstance
  )
  const rowText = clearErrorsAndWarningsHtmlWrapping(text)
  const styles = logStyles()
  const [expanded, setExpanded] = useState(props.expanded)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setExpanded(props.expanded)
  }, [props.expanded])

  useEffect(() => {
    if (props.expanded !== expanded) {
      setExpanded(props.expanded)
    }

    if (
      props.scrollToLogInstance &&
      props.scrollToLogInstance !== scrollToLogInstance
    ) {
      setScrollToLogInstance(props.scrollToLogInstance)
    }
  }, [props])

  useEffect(() => {
    if (expanded && scrollToLogInstance) {
      const { type, id } = scrollToLogInstance
      const line = document.getElementById(`${type}_${id}`)
      const logWrapper: HTMLDivElement | null =
        document.querySelector(`#logWrapper`)
      const logContainer: HTMLHeadElement | null =
        document.querySelector(`#log_container`)

      if (line && logWrapper && logContainer) {
        line.className = classes.HighlightedLine

        line.scrollIntoView({ behavior: 'smooth', block: 'start' })

        setTimeout(() => {
          line.classList.remove(classes.HighlightedLine)

          setScrollToLogInstance(undefined)
        }, 3000)
      }
    }
  }, [expanded, scrollToLogInstance, props])

  const { errors, warnings } = parseErrorsAndWarnings(text)

  const getLineRange = (separator = ' ... ') =>
    `${id * defaultChunkSize}${separator}${
      (id + 1) * defaultChunkSize < logLineCount
        ? (id + 1) * defaultChunkSize
        : logLineCount
    }`

  return (
    <div onClick={(evt) => props.onClick(evt, id)}>
      <button className={classes.ChunkHeader}>
        <Typography variant="subtitle1">
          <div className={classes.ChunkDetails}>
            <span>{`Lines: ${getLineRange()}`}</span>
            {copied ? (
              <CheckIcon
                className={[classes.Icon, classes.GreenIcon].join(' ')}
              />
            ) : (
              <ContentCopyIcon
                className={classes.Icon}
                onClick={(evt: SyntheticEvent) => {
                  evt.stopPropagation()

                  navigator.clipboard.writeText(rowText)

                  setCopied(true)

                  setTimeout(() => {
                    setCopied(false)
                  }, 1000)
                }}
              />
            )}
            <FileDownloadIcon
              onClick={(evt: SyntheticEvent) => {
                download(evt, rowText, `.${getLineRange('-')}`)
              }}
            />
            {errors && errors.length !== 0 && (
              <ErrorOutline
                color="error"
                className={classes.Icon}
                onClick={() => {
                  setScrollToLogInstance(errors[0])
                }}
              />
            )}
            {warnings && warnings.length !== 0 && (
              <Warning
                className={[classes.Icon, classes.GreenIcon].join(' ')}
                onClick={(evt) => {
                  if (expanded) evt.stopPropagation()

                  setScrollToLogInstance(warnings[0])
                }}
              />
            )}{' '}
            <ExpandMoreIcon
              className={classes.ChunkExpandIcon}
              style={{
                transform: expanded ? 'rotate(180deg)' : 'unset'
              }}
            />
          </div>
        </Typography>
      </button>
      <div
        className={classes.ChunkBody}
        style={{
          display: expanded ? 'block' : 'none'
        }}
      >
        <div
          id={`log_container`}
          className={[styles.expansionDescription, classes.LogContainer].join(
            ' '
          )}
        >
          <Highlight className={'html'} innerHTML={true}>
            {expanded ? text : ''}
          </Highlight>
        </div>
      </div>
    </div>
  )
}

export default LogChunk
