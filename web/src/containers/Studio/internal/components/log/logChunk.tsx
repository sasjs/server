import { useState, useEffect, SyntheticEvent } from 'react'
import { Typography } from '@mui/material'
import { ErrorOutlined, Warning } from '@mui/icons-material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import CheckIcon from '@mui/icons-material/Check'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import {
  defaultChunkSize,
  buildLogSegments,
  download,
  LogInstance
} from '../../../../../utils'
import classes from './log.module.css'

interface LogChunkProps {
  id: number
  text: string
  expanded: boolean
  logLineCount: number
  /** Every issue in the log, anchored by the line it sits on. */
  markers: LogInstance[]
  onClick: (evt: any, id: number) => void
  scrollToLogInstance?: LogInstance
  updated: number
}

/**
 * One chunk of a log. The chunk is the unit of rendering: a collapsed chunk puts
 * nothing in the document, and an expanded one carries one element per anchored
 * issue and one text node for the lines between them, so a hundred thousand line
 * log costs the browser elements in proportion to its errors, warnings and notes.
 *
 * The log text is rendered as text. It is SAS's own output and it contains
 * markup-like content - a doxygen header's `<h4> SAS Macros </h4>`, the `<` of a
 * comparison - which must stay visible as written rather than be parsed.
 */
const LogChunk = (props: LogChunkProps) => {
  const { id, text, logLineCount, markers } = props
  const [scrollToLogInstance, setScrollToLogInstance] = useState(
    props.scrollToLogInstance
  )
  const [expanded, setExpanded] = useState(props.expanded)
  const [copied, setCopied] = useState(false)

  const firstLine = id * defaultChunkSize
  const chunkMarkers = markers.filter(
    (marker) =>
      marker.line >= firstLine && marker.line < firstLine + defaultChunkSize
  )
  const errors = chunkMarkers.filter((marker) => marker.type === 'error')
  const warnings = chunkMarkers.filter((marker) => marker.type === 'warning')

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
        // The line already carries its severity colour, so the highlight is
        // added beside it and taken away again rather than replacing it.
        line.classList.add(classes.HighlightedLine)

        line.scrollIntoView({ behavior: 'smooth', block: 'start' })

        setTimeout(() => {
          line.classList.remove(classes.HighlightedLine)

          setScrollToLogInstance(undefined)
        }, 3000)
      }
    }
  }, [expanded, scrollToLogInstance, props])

  const getLineRange = (separator = ' ... ') =>
    `${firstLine}${separator}${
      firstLine + defaultChunkSize < logLineCount
        ? firstLine + defaultChunkSize
        : logLineCount
    }`

  const copy = (evt: SyntheticEvent) => {
    evt.stopPropagation()

    navigator.clipboard.writeText(text)

    setCopied(true)

    setTimeout(() => {
      setCopied(false)
    }, 1000)
  }

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
              <ContentCopyIcon className={classes.Icon} onClick={copy} />
            )}
            <FileDownloadIcon
              onClick={(evt: SyntheticEvent) => {
                download(evt, text, `.${getLineRange('-')}`)
              }}
            />
            {errors.length !== 0 && (
              <ErrorOutlined
                color="error"
                className={classes.Icon}
                onClick={() => {
                  setScrollToLogInstance(errors[0])
                }}
              />
            )}
            {warnings.length !== 0 && (
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
        onClick={(evt) => {
          evt.stopPropagation()
        }}
      >
        <div
          id={`log_container`}
          className={[classes.expansionDescription, classes.LogContainer].join(
            ' '
          )}
        >
          {expanded &&
            buildLogSegments(text, firstLine, chunkMarkers).map(
              (segment, index) => {
                // A block per segment: the container keeps the whitespace, and
                // a block ends the line without a separator node per line.
                if (!segment.marker) {
                  return <div key={`plain_${index}`}>{segment.text}</div>
                }

                const { type, id } = segment.marker

                return (
                  <div
                    key={`${type}_${id}`}
                    id={`${type}_${id}`}
                    className={
                      type === 'error'
                        ? classes.ErrorLine
                        : type === 'warning'
                          ? classes.WarningLine
                          : undefined
                    }
                  >
                    {segment.text}
                  </div>
                )
              }
            )}
        </div>
      </div>
    </div>
  )
}

export default LogChunk
