import React, { useEffect, useRef, useState } from 'react'
import axios from 'axios'

import Box from '@mui/material/Box'
import { Button, Paper, Stack, Tab } from '@mui/material'
import { makeStyles } from '@mui/styles'
import Editor from '@monaco-editor/react'
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

  const editorRef = useRef(null)
  const handleEditorDidMount = (editor: any) => (editorRef.current = editor)

  const getSelection = () => {
    const editor = editorRef.current as any
    const selection = editor?.getModel().getValueInRange(editor?.getSelection())
    return selection ?? ''
  }

  const handleRunSelectionBtnClick = () => runCode(getSelection())

  const handleRunBtnClick = () => runCode(fileContent)

  const runCode = (code: string) => {
    axios
      .post(`/SASjsApi/code/execute`, { code })
      .then((res: any) => {
        setLog(`<div><h2>SAS Log</h2><pre>${res?.data?.log}</pre></div>`)

        let weboutString: string
        try {
          weboutString = res.data.webout
            .split('>>weboutBEGIN<<')[1]
            .split('>>weboutEND<<')[0]
        } catch (_) {
          weboutString = res.data.webout
        }

        let webout: any
        try {
          webout = JSON.parse(weboutString)
        } catch (_) {
          webout = weboutString
        }

        setWebout(`<pre><code>${JSON.stringify(webout, null, 4)}</code></pre>`)
        setTab('2')
      })
      .catch((err) => console.log(err))
  }

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
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
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
              <Button variant="contained" onClick={handleRunSelectionBtnClick}>
                Run Selected SAS Code
              </Button>
            </Stack>
          </TabPanel>
          <TabPanel value="2">
            <div dangerouslySetInnerHTML={{ __html: log }} />
          </TabPanel>
          <TabPanel value="3">
            <div dangerouslySetInnerHTML={{ __html: webout }} />
          </TabPanel>
        </TabContext>
      </Box>
    </>
  )
}

export default Studio
