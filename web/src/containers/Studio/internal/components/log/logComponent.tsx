import { useEffect, useState } from 'react'
import TreeView from '@mui/lab/TreeView'
import TreeItem from '@mui/lab/TreeItem'
import { ChevronRight, ExpandMore } from '@mui/icons-material'
import { Typography } from '@mui/material'
import { ListItemText } from '@mui/material'
import { makeStyles } from '@mui/styles'
import Highlight from 'react-highlight'
import { LogObject, defaultChunkSize } from '../../../../../utils'
import { RunTimeType } from '../../../../../context/appContext'
import { splitIntoChunks, LogInstance } from '../../../../../utils'
import LogChunk from './logChunk'
import classes from './log.module.css'

export const logStyles: any = makeStyles((theme: any) => ({
  expansionDescription: {
    [theme.breakpoints.down('sm')]: {
      fontSize: theme.typography.pxToRem(12)
    },
    [theme.breakpoints.up('md')]: {
      fontSize: theme.typography.pxToRem(16)
    }
  }
}))

interface LogComponentProps {
  log: LogObject | string
  selectedRunTime: RunTimeType | string
}

const LogComponent = (props: LogComponentProps) => {
  const { log, selectedRunTime } = props
  const logObject = log as LogObject
  const logChunks = splitIntoChunks(logObject?.body || '')
  const [logChunksState, setLogChunksState] = useState<boolean[]>(
    new Array(logChunks.length).fill(false)
  )
  const [scrollToLogInstance, setScrollToLogInstance] = useState<LogInstance>()
  const [oldestExpandedChunk, setOldestExpandedChunk] = useState<number>(
    logChunksState.length - 1
  )
  const maxOpenedChunks = 2

  const styles = logStyles()

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

    setTimeout(() => {
      scrollToTheBottom()
    }, 100)
  }, [])

  // INFO: scroll to the bottom of the log
  const scrollToTheBottom = () => {
    const logWrapper: HTMLDivElement | null =
      document.querySelector(`#logWrapper`)

    if (logWrapper) {
      logWrapper.scrollTop = logWrapper.scrollHeight
    }
  }

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

  const hasErrorsOrWarnings =
    logObject.errors?.length !== 0 || logObject.warnings?.length !== 0
  const logBody = typeof log === 'string' ? log : log.body

  return (
    <>
      {selectedRunTime === RunTimeType.SAS && logObject.body ? (
        <div id="logWrapper" className={classes.LogWrapper}>
          <div>
            {hasErrorsOrWarnings && (
              <div className={classes.TreeContainer}>
                <TreeView
                  defaultCollapseIcon={<ExpandMore />}
                  defaultExpandIcon={<ChevronRight />}
                >
                  {logObject.errors && logObject.errors.length !== 0 && (
                    <TreeItem
                      nodeId="errors"
                      label={
                        <Typography color="error">
                          {`Errors (${logObject.errors.length})`}
                        </Typography>
                      }
                    >
                      {logObject.errors &&
                        logObject.errors.map((error, ind) => (
                          <TreeItem
                            nodeId={`error_${ind}`}
                            label={<ListItemText primary={error.body} />}
                            key={`error_${ind}`}
                            onClick={() => goToLogLine(error, ind)}
                          />
                        ))}
                    </TreeItem>
                  )}
                  {logObject.warnings && logObject.warnings.length !== 0 && (
                    <TreeItem
                      nodeId="warnings"
                      label={
                        <Typography>{`Warnings (${logObject.warnings.length})`}</Typography>
                      }
                    >
                      {logObject.warnings &&
                        logObject.warnings.map((warning, ind) => (
                          <TreeItem
                            nodeId={`warning_${ind}`}
                            label={<ListItemText primary={warning.body} />}
                            key={`warning_${ind}`}
                            onClick={() => goToLogLine(warning, ind)}
                          />
                        ))}
                    </TreeItem>
                  )}
                </TreeView>
              </div>
            )}
          </div>
          <div className={classes.ChunksContainer}>
            {Array.isArray(logChunks) ? (
              logChunks.map((chunk: string, id: number) => (
                <LogChunk
                  id={id}
                  text={chunk}
                  expanded={logChunksState[id]}
                  key={`log-chunk-${id}`}
                  logLineCount={logObject.linesCount}
                  scrollToLogInstance={scrollToLogInstance}
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
              ))
            ) : (
              <Typography
                id={`log_container`}
                variant="h5"
                className={[
                  styles.expansionDescription,
                  classes.LogContainer
                ].join(' ')}
              >
                <Highlight className={'html'} innerHTML={true}>
                  {logChunks}
                </Highlight>
              </Typography>
            )}
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
