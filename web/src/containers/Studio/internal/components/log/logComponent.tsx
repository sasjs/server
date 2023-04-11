import TreeView from '@mui/lab/TreeView'
import TreeItem from '@mui/lab/TreeItem'
import { ChevronRight, ExpandMore } from '@mui/icons-material'
import { Typography } from '@mui/material'
import { ListItemText } from '@mui/material'
import { makeStyles } from '@mui/styles'
import Highlight from 'react-highlight'
import { LogObject } from '../../../../../utils'
import { RunTimeType } from '../../../../../context/appContext'

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

interface LogComponentProps {
  log: LogObject
  selectedRunTime: RunTimeType
}

const LogComponent = (props: LogComponentProps) => {
  const { log, selectedRunTime } = props

  const classes = useStyles()

  const goToLogLine = (type: 'error' | 'warning', ind: number) => {
    const line = document.getElementById(`${type}_${ind}`)
    const logWrapper: HTMLDivElement | null =
      document.querySelector(`#logWrapper`)
    const logContainer: HTMLHeadElement | null =
      document.querySelector(`#log_container`)

    if (line && logWrapper && logContainer) {
      line.style.backgroundColor = '#f6e30599'
      logWrapper.scrollTop =
        line.offsetTop - logWrapper.offsetTop + logContainer.offsetTop

      setTimeout(() => {
        line.setAttribute('style', '')
      }, 3000)
    }
  }

  const decodeHtml = (encodedString: string) => {
    const tempElement = document.createElement('textarea')
    tempElement.innerHTML = encodedString

    return tempElement.value
  }

  return (
    <>
      {selectedRunTime === RunTimeType.SAS ? (
        <div
          id="logWrapper"
          style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 130px)' }}
        >
          <div style={{ backgroundColor: 'white' }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 10
              }}
            ></div>
            <div style={{ paddingBottom: 10 }}>
              <TreeView
                defaultCollapseIcon={<ExpandMore />}
                defaultExpandIcon={<ChevronRight />}
              >
                {log.errors && log.errors.length !== 0 && (
                  <TreeItem
                    nodeId="errors"
                    label={
                      <Typography color="error">
                        {`Errors (${log.errors.length})`}
                      </Typography>
                    }
                  >
                    {log.errors &&
                      log.errors.map((error, ind) => (
                        <TreeItem
                          nodeId={`error_${ind}`}
                          label={<ListItemText primary={error} />}
                          key={`error_${ind}`}
                          onClick={() => goToLogLine('error', ind)}
                        />
                      ))}
                  </TreeItem>
                )}
                {log.warnings && log.warnings.length !== 0 && (
                  <TreeItem
                    nodeId="warnings"
                    label={
                      <Typography>{`Warnings (${log.warnings.length})`}</Typography>
                    }
                  >
                    {log.warnings &&
                      log.warnings.map((warning, ind) => (
                        <TreeItem
                          nodeId={`warning_${ind}`}
                          label={<ListItemText primary={warning} />}
                          key={`warning_${ind}`}
                          onClick={() => goToLogLine('warning', ind)}
                        />
                      ))}
                  </TreeItem>
                )}
              </TreeView>
            </div>
          </div>

          <Typography
            id={`log_container`}
            variant="h5"
            className={classes.expansionDescription}
          >
            <Highlight className={'html'} innerHTML={true}>
              {decodeHtml(log?.body || '')}
            </Highlight>
          </Typography>
        </div>
      ) : (
        <div>
          <h2>Log</h2>
          <pre
            id="log"
            style={{ overflow: 'auto', height: 'calc(100vh - 220px)' }}
          >
            {log}
          </pre>
        </div>
      )}
    </>
  )
}

export default LogComponent
