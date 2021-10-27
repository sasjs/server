import React, { useState, useEffect } from 'react'
import axios from 'axios'

import Editor from '@monaco-editor/react'

import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import Toolbar from '@mui/material/Toolbar'
import CircularProgress from '@mui/material/CircularProgress'

const Main = (props: any) => {
  const baseUrl = window.location.origin

  const [isLoading, setIsLoading] = useState(false)
  const [fileContentBeforeEdit, setFileContentBeforeEdit] = useState('')
  const [fileContent, setFileContent] = useState('')
  const [editMode, setEditMode] = useState(false)

  useEffect(() => {
    if (props.selectedFilePath) {
      setIsLoading(true)
      axios
        .get(`/SASjsApi/files?filePath=${props.selectedFilePath}`)
        .then((res: any) => {
          setFileContent(res.data.fileContent)
        })
        .catch((err) => {
          console.log(err)
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [props.selectedFilePath])

  const handleEditSaveBtnClick = () => {
    if (!editMode) {
      setFileContentBeforeEdit(fileContent)
      setEditMode(true)
    } else {
      setIsLoading(true)
      axios
        .post(`/SASjsApi/files`, {
          filePath: props.selectedFilePath,
          fileContent: fileContent
        })
        .then((res) => {
          setEditMode(false)
        })
        .catch((err) => {
          console.log(err)
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }

  const handleCancelExecuteBtnClick = () => {
    if (editMode) {
      setFileContent(fileContentBeforeEdit)
      setEditMode(false)
    } else {
      window.open(
        `${baseUrl}/SASjsExecutor/do?_program=${props.selectedFilePath.replace(/.sas$/, "")}`
      )
    }
  }

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
        {isLoading && (
          <CircularProgress
            style={{ position: 'absolute', left: '50%', top: '50%' }}
          />
        )}
        {!isLoading && props?.selectedFilePath !== '' && !editMode && (
          <code style={{ whiteSpace: 'break-spaces' }}>{fileContent}</code>
        )}
        {!isLoading && props?.selectedFilePath !== '' && editMode && (
          <Editor
            height="95%"
            value={fileContent}
            onChange={(val) => {
              if (val) setFileContent(val)
            }}
          />
        )}
      </Paper>
      <Stack
        spacing={3}
        direction="row"
        sx={{ justifyContent: 'center', marginTop: '20px' }}
      >
        <Button
          variant="contained"
          onClick={handleEditSaveBtnClick}
          disabled={isLoading || props?.selectedFilePath === ''}
        >
          {!editMode ? 'Edit' : 'Save'}
        </Button>
        <Button
          variant="contained"
          onClick={handleCancelExecuteBtnClick}
          disabled={isLoading || props?.selectedFilePath === ''}
        >
          {editMode ? 'Cancel' : 'Execute'}
        </Button>
      </Stack>
    </Box>
  )
}

export default Main
