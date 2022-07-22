import React, { useState, useMemo } from 'react'
import axios from 'axios'
import { Backdrop, Box, CircularProgress, Drawer, Toolbar } from '@mui/material'

import TreeView from '../../components/tree'
import BootstrapSnackbar, { AlertSeverityType } from '../../components/snackbar'
import Modal from '../../components/modal'
import { TreeNode } from '../../utils/types'

const drawerWidth = 240

type Props = {
  selectedFilePath: string
  directoryData: TreeNode | null
  handleSelect: (filePath: string) => void
  removeFileFromTree: (filePath: string) => void
  refreshSideBar: () => void
}

const SideBar = ({
  selectedFilePath,
  directoryData,
  handleSelect,
  removeFileFromTree,
  refreshSideBar
}: Props) => {
  const [isLoading, setIsLoading] = useState(false)
  const [openModal, setOpenModal] = useState(false)
  const [modalTitle, setModalTitle] = useState('')
  const [modalPayload, setModalPayload] = useState('')
  const [openSnackbar, setOpenSnackbar] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState<AlertSeverityType>(
    AlertSeverityType.Success
  )
  const defaultExpanded = useMemo(() => {
    const splittedPath = selectedFilePath.split('/')
    const arr = ['']
    let nodeId = ''
    splittedPath.forEach((path) => {
      if (path !== '') {
        nodeId += '/' + path
        arr.push(nodeId)
      }
    })
    return arr
  }, [selectedFilePath])

  const deleteNode = (path: string, isFolder: boolean) => {
    setIsLoading(true)
    const axiosPromise = axios.delete(
      `/SASjsApi/drive/${
        isFolder ? `folder?_folderPath=${path}` : `file?_filePath=${path}`
      }`
    )

    axiosPromise
      .then(() => {
        removeFileFromTree(path)
        setSnackbarMessage('Deleted!')
        setSnackbarSeverity(AlertSeverityType.Success)
        setOpenSnackbar(true)
      })
      .catch((err) => {
        setModalTitle('Abort')
        setModalPayload(
          typeof err.response.data === 'object'
            ? JSON.stringify(err.response.data)
            : err.response.data
        )
        setOpenModal(true)
      })
      .finally(() => setIsLoading(false))
  }

  const addFile = (filePath: string) => {
    const formData = new FormData()
    const stringBlob = new Blob([''], { type: 'text/plain' })
    formData.append('file', stringBlob)
    formData.append('filePath', filePath)

    setIsLoading(true)
    axios
      .post('/SASjsApi/drive/file', formData)
      .then(() => {
        setSnackbarMessage('File added!')
        setSnackbarSeverity(AlertSeverityType.Success)
        setOpenSnackbar(true)
        refreshSideBar()
      })
      .catch((err) => {
        setModalTitle('Abort')
        setModalPayload(
          typeof err.response.data === 'object'
            ? JSON.stringify(err.response.data)
            : err.response.data
        )
        setOpenModal(true)
      })
      .finally(() => setIsLoading(false))
  }

  const addFolder = (folderPath: string) => {
    setIsLoading(true)
    axios
      .post('/SASjsApi/drive/folder', { folderPath })
      .then(() => {
        setSnackbarMessage('Folder added!')
        setSnackbarSeverity(AlertSeverityType.Success)
        setOpenSnackbar(true)
        refreshSideBar()
      })
      .catch((err) => {
        setModalTitle('Abort')
        setModalPayload(
          typeof err.response.data === 'object'
            ? JSON.stringify(err.response.data)
            : err.response.data
        )
        setOpenModal(true)
      })
      .finally(() => setIsLoading(false))
  }

  const rename = (oldPath: string, newPath: string) => {
    setIsLoading(true)
    axios
      .post('/SASjsApi/drive/rename', { oldPath, newPath })
      .then(() => {
        setSnackbarMessage('Successfully Renamed')
        setSnackbarSeverity(AlertSeverityType.Success)
        setOpenSnackbar(true)
        if (oldPath === selectedFilePath) handleSelect(newPath)
        else if (selectedFilePath.startsWith(oldPath))
          handleSelect(selectedFilePath.replace(oldPath, newPath))
        refreshSideBar()
      })
      .catch((err) => {
        setModalTitle('Abort')
        setModalPayload(
          typeof err.response.data === 'object'
            ? JSON.stringify(err.response.data)
            : err.response.data
        )
        setOpenModal(true)
      })
      .finally(() => setIsLoading(false))
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' }
      }}
    >
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={isLoading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      <Toolbar />
      <Box sx={{ overflow: 'auto' }}>
        {directoryData && (
          <TreeView
            node={directoryData}
            selectedFilePath={selectedFilePath}
            handleSelect={handleSelect}
            deleteNode={deleteNode}
            addFile={addFile}
            addFolder={addFolder}
            rename={rename}
            defaultExpanded={defaultExpanded}
          />
        )}
      </Box>
      <BootstrapSnackbar
        open={openSnackbar}
        setOpen={setOpenSnackbar}
        message={snackbarMessage}
        severity={snackbarSeverity}
      />
      <Modal
        open={openModal}
        setOpen={setOpenModal}
        title={modalTitle}
        payload={modalPayload}
      />
    </Drawer>
  )
}

export default SideBar
