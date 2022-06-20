import React, { useEffect, useRef, useState, useContext } from 'react'
import axios from 'axios'

import {
  Box,
  MenuItem,
  FormControl,
  Select,
  SelectChangeEvent,
  Button,
  Paper,
  Tab,
  Tooltip
} from '@mui/material'
import { makeStyles } from '@mui/styles'
import Editor, { EditorDidMount } from 'react-monaco-editor'
import { useLocation } from 'react-router-dom'
import { TabContext, TabList, TabPanel } from '@mui/lab'

import { AppContext, RunTimeType } from '../../context/appContext'

const useStyles = makeStyles(() => ({
  root: {
    fontSize: '1rem',
    color: 'gray',
    '&.Mui-selected': {
      color: 'black'
    }
  },
  subMenu: {
    marginTop: '25px',
    display: 'flex',
    justifyContent: 'center'
  },
  runButton: {
    display: 'flex',
    alignItems: 'center',
    padding: '5px 5px',
    minWidth: 'unset'
  }
}))

const Studio = () => {
  const appContext = useContext(AppContext)
  const location = useLocation()
  const [fileContent, setFileContent] = useState('')
  const [log, setLog] = useState('')
  const [ctrlPressed, setCtrlPressed] = useState(false)
  const [webout, setWebout] = useState('')
  const [tab, setTab] = useState('1')
  const [runTimes, setRunTimes] = useState<string[]>([])
  const [selectedRunTime, setSelectedRunTime] = useState('')

  useEffect(() => {
    setRunTimes(Object.values(appContext.runTimes))
  }, [appContext.runTimes])

  useEffect(() => {
    if (runTimes.length) setSelectedRunTime(runTimes[0])
  }, [runTimes])

  const handleTabChange = (_e: any, newValue: string) => {
    setTab(newValue)
  }

  const editorRef = useRef(null as any)
  const handleEditorDidMount: EditorDidMount = (editor) => {
    editor.focus()
    editorRef.current = editor
  }

  const getSelection = () => {
    const editor = editorRef.current as any
    const selection = editor?.getModel().getValueInRange(editor?.getSelection())
    return selection ?? ''
  }

  const handleRunBtnClick = () => runCode(getSelection() || fileContent)

  const runCode = (code: string) => {
    axios
      .post(`/SASjsApi/code/execute`, { code, runTime: selectedRunTime })
      .then((res: any) => {
        const parsedLog = res?.data?.log
          .map((logLine: any) => logLine.line)
          .join('\n')

        setLog(parsedLog)

        setWebout(`${res.data?._webout}`)
        setTab('2')

        // Scroll to bottom of log
        window.scrollTo(0, document.body.scrollHeight)
      })
      .catch((err) => console.log(err))
  }

  const handleKeyDown = (event: any) => {
    if (event.ctrlKey) {
      if (event.key === 'v') {
        setCtrlPressed(false)
      }

      if (event.key === 'Enter') runCode(getSelection() || fileContent)
      if (!ctrlPressed) setCtrlPressed(true)
    }
  }

  const handleKeyUp = (event: any) => {
    if (!event.ctrlKey && ctrlPressed) setCtrlPressed(false)
  }

  const handleChangeRunTime = (event: SelectChangeEvent) => {
    setSelectedRunTime(event.target.value as RunTimeType)
  }

  useEffect(() => {
    const content = localStorage.getItem('fileContent') ?? ''
    setFileContent(content)
  }, [])

  useEffect(() => {
    if (fileContent.length) {
      localStorage.setItem('fileContent', fileContent)
    }
  }, [fileContent])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const programPath = params.get('_program')

    if (programPath?.length)
      axios
        .get(`/SASjsApi/drive/file?filePath=${programPath}`)
        .then((res: any) => setFileContent(res.data.fileContent))
        .catch((err) => console.log(err))
  }, [location.search])

  const classes = useStyles()

  return (
    <Box
      onKeyUp={handleKeyUp}
      onKeyDown={handleKeyDown}
      sx={{ width: '100%', typography: 'body1', marginTop: '50px' }}
    >
      <TabContext value={tab}>
        <Box
          sx={{
            borderBottom: 1,
            borderColor: 'divider'
          }}
          style={{ position: 'fixed', background: 'white', width: '100%' }}
        >
          <TabList onChange={handleTabChange} centered>
            <Tab className={classes.root} label="Code" value="1" />
            <Tab className={classes.root} label="Log" value="2" />
            <Tooltip title="Displays content from the _webout fileref">
              <Tab className={classes.root} label="Webout" value="3" />
            </Tooltip>
          </TabList>
        </Box>

        <TabPanel sx={{ paddingBottom: 0 }} value="1">
          <div className={classes.subMenu}>
            <Tooltip title="CTRL+ENTER will also run SAS code">
              <Button onClick={handleRunBtnClick} className={classes.runButton}>
                <img
                  alt=""
                  draggable="false"
                  style={{ width: '25px' }}
                  src="/running-sas.png"
                ></img>
                <span style={{ fontSize: '12px' }}>RUN</span>
              </Button>
            </Tooltip>
            <Box sx={{ minWidth: '75px', marginLeft: '10px' }}>
              <FormControl variant="standard">
                <Select
                  labelId="run-time-select-label"
                  id="run-time-select"
                  value={selectedRunTime}
                  onChange={handleChangeRunTime}
                >
                  {runTimes.map((runTime) => (
                    <MenuItem key={runTime} value={runTime}>
                      {runTime}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </div>
          <Paper
            sx={{
              height: 'calc(100vh - 170px)',
              padding: '10px',
              overflow: 'auto',
              position: 'relative'
            }}
            elevation={3}
          >
            <Editor
              height="98%"
              language="sas"
              value={fileContent}
              editorDidMount={handleEditorDidMount}
              options={{ readOnly: ctrlPressed }}
              onChange={(val) => {
                if (val) setFileContent(val)
              }}
            />
            <p
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: -10,
                textAlign: 'center',
                fontSize: '13px'
              }}
            >
              Press CTRL + ENTER to run SAS code
            </p>
          </Paper>
        </TabPanel>
        <TabPanel value="2">
          <div style={{ marginTop: '50px' }}>
            <h2>SAS Log</h2>
            <pre>{log}</pre>
          </div>
        </TabPanel>
        <TabPanel value="3">
          <div style={{ marginTop: '50px' }}>
            <pre>{webout}</pre>
          </div>
        </TabPanel>
      </TabContext>
    </Box>
  )
}

export default Studio
