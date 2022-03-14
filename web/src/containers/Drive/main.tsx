import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
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
        .get(`/SASjsApi/drive/file?_filePath=${props.selectedFilePath}`)
        .then((res: any) => {
          setFileContent(res.data)
        })
        .catch((err) => {
          console.log(err)
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [props.selectedFilePath])

  const handleDeleteBtnClick = () => {
    setIsLoading(true)

    const filePath = props.selectedFilePath

    axios
      .delete(`/SASjsApi/drive/file?_filePath=${filePath}`)
      .then((res) => {
        setFileContent('')
        window.history.pushState('', '', `${baseUrl}/#/SASjsDrive`)
      })
      .catch((err) => {
        console.log(err)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  const handleEditSaveBtnClick = () => {
    if (!editMode) {
      setFileContentBeforeEdit(fileContent)
      setEditMode(true)
    } else {
      setIsLoading(true)

      const formData = new FormData()

      const stringBlob = new Blob([fileContent], { type: 'text/plain' })
      formData.append('file', stringBlob, 'filename.sas')
      formData.append('filePath', props.selectedFilePath)

      axios
        .patch(`/SASjsApi/drive/file`, formData)
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
        `${baseUrl}/SASjsApi/stp/execute?_program=${props.selectedFilePath.replace(
          /.sas$/,
          ''
        )}`
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
        {!isLoading && props?.selectedFilePath && !editMode && (
          <code style={{ whiteSpace: 'break-spaces' }}>{fileContent}</code>
        )}
        {!isLoading && props?.selectedFilePath && editMode && (
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
          onClick={handleDeleteBtnClick}
          disabled={isLoading || !props?.selectedFilePath}
        >
          Delete
        </Button>
        <Button
          variant="contained"
          onClick={handleEditSaveBtnClick}
          disabled={isLoading || !props?.selectedFilePath}
        >
          {!editMode ? 'Edit' : 'Save'}
        </Button>
        <Button
          variant="contained"
          onClick={handleCancelExecuteBtnClick}
          disabled={isLoading || !props?.selectedFilePath}
        >
          {editMode ? 'Cancel' : 'Execute'}
        </Button>
        {props?.selectedFilePath && (
          <Button
            variant="contained"
            component={Link}
            to={`/SASjsStudio?_program=${props.selectedFilePath}`}
          >
            Open in Studio
          </Button>
        )}
      </Stack>
    </Box>
  )
}

export default Main
