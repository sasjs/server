import { useEffect, useMemo, useState } from 'react'
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView'
import { TreeItem } from '@mui/x-tree-view/TreeItem'
import { ChevronRight, ExpandMore } from '@mui/icons-material'
import { Typography } from '@mui/material'
import { ListItemText } from '@mui/material'
import { LogObject, defaultChunkSize } from '../../../../../utils'
import { RunTimeType } from '../../../../../context/appContext'
import { splitIntoChunks, LogInstance } from '../../../../../utils'
import LogChunk from './logChunk'
import classes from './log.module.css'

interface LogComponentProps {
  log: LogObject | string
  selectedRunTime: RunTimeType | string
  /** Whether the notable notes are listed. */
  notesListed: boolean
}

const LogComponent = (props: LogComponentProps) => {
  const { log, selectedRunTime, notesListed } = props
  const logObject = log as LogObject
  const logChunks = splitIntoChunks(logObject?.body || '')
  // Parsed once for the whole log: the chunk views anchor the lines these
  // issues sit on rather than re-parsing their own slice.
  const markers = useMemo(
    () => [
      ...(logObject?.errors ?? []),
      ...(logObject?.warnings ?? []),
      ...(logObject?.notes ?? [])
    ],
    [logObject]
  )
  const [logChunksState, setLogChunksState] = useState<boolean[]>(
    new Array(logChunks.length).fill(false)
  )
  const [scrollToLogInstance, setScrollToLogInstance] = useState<LogInstance>()
  const [oldestExpandedChunk, setOldestExpandedChunk] = useState<number>(
    logChunksState.length - 1
  )
  const maxOpenedChunks = 2

  const goToLogLine = (logInstance: LogInstance, ind: number) => {
    let chunkNumber = 0

    for (
      let i = 0;
      i <= Math.ceil(logObject.linesCount / defaultChunkSize);
      i++
    ) {
      if (logInstance.line < (i + 1) * defaultChunkSize) {
        chunkNumber = i

        break
      }
    }

    setLogChunksState((prevState) => {
      const newState = [...prevState]
      newState[chunkNumber] = true

      const chunkToCollapse = getChunkToAutoCollapse()

      if (chunkToCollapse !== undefined) {
        newState[chunkToCollapse] = false
      }

      return newState
    })

    setScrollToLogInstance(logInstance)
  }

  useEffect(() => {
    // INFO: expand the last chunk by default
    setLogChunksState((prevState) => {
      const lastChunk = prevState.length - 1

      const newState = [...prevState]
      newState[lastChunk] = true

      return newState
    })
  }, [])

  /**
   * Opening the log puts the reader at its top, where the summary sits.
   *
   * The summary tree - errors, warnings and notes with their counts - is the
   * first thing a reader wants, and it is a few lines tall. This component used
   * to jump to the end of the log a moment after mounting, and it mounts at the
   * moment the log tab opens after a run, so the summary was scrolled past
   * before it could be read: the reader landed at the end of the log with the
   * counts above the fold, and the only way back was to scroll up by hand. The
   * summary scrolling out of view when the reader scrolls is fine - what was
   * not fine was starting there.
   *
   * Keyed on the log rather than on mount: a new run replaces it, and the new
   * log opens at its own summary instead of at the position the previous one
   * had been left at.
   */
  useEffect(() => {
    const logWrapper: HTMLDivElement | null =
      document.querySelector(`#logWrapper`)

    if (logWrapper) logWrapper.scrollTop = 0
  }, [logObject])

  const getChunkToAutoCollapse = () => {
    const openedChunks = logChunksState
      .map((chunkState: boolean, id: number) => (chunkState ? id : undefined))
      .filter((chunk) => chunk !== undefined)

    if (openedChunks.length < maxOpenedChunks) return undefined
    else {
      const chunkToCollapse = oldestExpandedChunk
      const newOldestChunk = openedChunks.filter(
        (chunk) => chunk !== chunkToCollapse
      )[0]

      if (newOldestChunk !== undefined) {
        setOldestExpandedChunk(newOldestChunk)

        return chunkToCollapse
      }

      return undefined
    }
  }

  const listedNotes = notesListed ? (logObject.notes ?? []) : []
  const hasIssues =
    (logObject.errors?.length ?? 0) > 0 ||
    (logObject.warnings?.length ?? 0) > 0 ||
    listedNotes.length > 0
  const logBody = typeof log === 'string' ? log : log.body

  return (
    <>
      {selectedRunTime === RunTimeType.SAS && logObject.body ? (
        <div id="logWrapper" className={classes.LogWrapper}>
          <div>
            {hasIssues && (
              <div className={classes.TreeContainer}>
                <SimpleTreeView
                  slots={{ collapseIcon: ExpandMore, expandIcon: ChevronRight }}
                >
                  {logObject.errors && logObject.errors.length !== 0 && (
                    <TreeItem
                      itemId="errors"
                      label={
                        <Typography color="error">
                          {`Errors (${logObject.errors.length})`}
                        </Typography>
                      }
                    >
                      {logObject.errors &&
                        logObject.errors.map((error, ind) => (
                          <TreeItem
                            itemId={`error_${ind}`}
                            label={<ListItemText primary={error.body} />}
                            key={`error_${ind}`}
                            onClick={() => goToLogLine(error, ind)}
                          />
                        ))}
                    </TreeItem>
                  )}
                  {logObject.warnings && logObject.warnings.length !== 0 && (
                    <TreeItem
                      itemId="warnings"
                      label={
                        <Typography>{`Warnings (${logObject.warnings.length})`}</Typography>
                      }
                    >
                      {logObject.warnings &&
                        logObject.warnings.map((warning, ind) => (
                          <TreeItem
                            itemId={`warning_${ind}`}
                            label={<ListItemText primary={warning.body} />}
                            key={`warning_${ind}`}
                            onClick={() => goToLogLine(warning, ind)}
                          />
                        ))}
                    </TreeItem>
                  )}
                  {listedNotes.length !== 0 && (
                    <TreeItem
                      itemId="notes"
                      label={
                        <Typography>{`Notes (${listedNotes.length})`}</Typography>
                      }
                    >
                      {listedNotes.map((note, ind) => (
                        <TreeItem
                          itemId={`note_${ind}`}
                          label={<ListItemText primary={note.body} />}
                          key={`note_${ind}`}
                          onClick={() => goToLogLine(note, ind)}
                        />
                      ))}
                    </TreeItem>
                  )}
                </SimpleTreeView>
              </div>
            )}
          </div>
          <div className={classes.ChunksContainer}>
            {logChunks.map((chunk: string, id: number) => (
              <LogChunk
                id={id}
                text={chunk}
                expanded={logChunksState[id]}
                key={`log-chunk-${id}`}
                logLineCount={logObject.linesCount}
                markers={markers}
                scrollToLogInstance={scrollToLogInstance}
                updated={Date.now()}
                onClick={(_, chunkNumber) => {
                  setLogChunksState((prevState) => {
                    const newState = [...prevState]
                    const expand = !newState[chunkNumber]

                    newState[chunkNumber] = expand

                    if (expand) {
                      const chunkToCollapse = getChunkToAutoCollapse()

                      if (chunkToCollapse !== undefined) {
                        newState[chunkToCollapse] = false
                      }
                    }

                    return newState
                  })

                  setScrollToLogInstance(undefined)
                }}
              />
            ))}
          </div>
        </div>
      ) : (
        <div>
          <h2>Log</h2>
          <pre id="log" className={classes.LogBody}>
            {logBody}
          </pre>
        </div>
      )}
    </>
  )
}

export default LogComponent
