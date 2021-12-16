import React, { useEffect, useRef, useState } from 'react'
import axios from 'axios'

import Box from '@mui/material/Box'
import { Button, Paper, Stack, Toolbar } from '@mui/material'
import Editor from '@monaco-editor/react'
import { useLocation } from 'react-router-dom'

const Studio = () => {
  const location = useLocation()
  const [fileContent, setFileContent] = useState('')
  const [log, setLog] = useState('')

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
      .post(`/SASjsApi/stp/run`, { code })
      .then((res: any) => {
        const data =
          typeof res.data === 'string'
            ? res.data
            : `<pre><code>${JSON.stringify(res.data, null, 4)}</code></pre>`

        setLog(data)
        document?.getElementById('sas_log')?.scrollIntoView()
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

  return (
    <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
      <Toolbar />
      <Paper
        sx={{
          height: '75vh',
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
      {log && (
        <>
          <br />
          <h2 id="sas_log">Output</h2>
          <br />
          <div dangerouslySetInnerHTML={{ __html: log }} />
        </>
      )}
    </Box>
  )
}

export default Studio
