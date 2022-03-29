import React, { useEffect, useRef, useState } from 'react'
import axios from 'axios'

import Box from '@mui/material/Box'
import { Button, Paper, Stack, Tab } from '@mui/material'
import { makeStyles } from '@mui/styles'
import Editor, { OnMount } from '@monaco-editor/react'
import { useLocation } from 'react-router-dom'
import { TabContext, TabList, TabPanel } from '@mui/lab'

const useStyles = makeStyles(() => ({
  root: {
    fontSize: '1rem',
    color: 'gray',
    '&.Mui-selected': {
      color: 'black'
    }
  }
}))

const Studio = () => {
  const location = useLocation()
  const [fileContent, setFileContent] = useState('')
  const [log, setLog] = useState('')
  const [webout, setWebout] = useState('')
  const [tab, setTab] = React.useState('1')
  const handleTabChange = (_e: any, newValue: string) => {
    setTab(newValue)
  }

  const editorRef = useRef(null as any)
  const handleEditorDidMount: OnMount = (editor) => {
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
      .post(`/SASjsApi/code/execute`, { code })
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
    <>
      <br />
      <br />
      <br />
      <Box sx={{ width: '100%', typography: 'body1' }}>
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
              <Tab className={classes.root} label="Webout" value="3" />
            </TabList>
          </Box>
          <TabPanel value="1">
            {/* <Toolbar /> */}
            <Paper
              sx={{
                height: '70vh',
                marginTop: '50px',
                padding: '10px',
                overflow: 'auto',
                position: 'relative'
              }}
              elevation={3}
            >
              <Editor
                height="95%"
                value={fileContent}
                onMount={handleEditorDidMount}
                onChange={(val) => {
                  if (val) setFileContent(val)
                }}
              />
            </Paper>
            <Stack
              spacing={3}
              direction="row"
              sx={{ justifyContent: 'center', marginTop: '20px' }}
            >
              <Button variant="contained" onClick={handleRunBtnClick}>
                Run SAS Code
              </Button>
            </Stack>
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
    </>
  )
}

export default Studio
