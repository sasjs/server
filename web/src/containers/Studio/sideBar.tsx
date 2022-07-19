import React, { useMemo } from 'react'
import axios from 'axios'
import { Box, Drawer, Toolbar } from '@mui/material'

import TreeView from '../../components/tree'
import { TreeNode } from '../../utils/types'

const drawerWidth = 240

type Props = {
  selectedFilePath: string
  directoryData: TreeNode | null
  handleSelect: (filePath: string) => void
  removeFileFromTree: (filePath: string) => void
}

const SideBar = ({
  selectedFilePath,
  directoryData,
  handleSelect,
  removeFileFromTree
}: Props) => {
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
    const axiosPromise = axios.delete(
      `/SASjsApi/drive/${
        isFolder ? `folder?_folderPath=${path}` : `file?_filePath=${path}`
      }`
    )

    axiosPromise
      .then(() => removeFileFromTree(path))
      .catch((err) => {
        console.log(err)
      })
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
      <Toolbar />
      <Box sx={{ overflow: 'auto' }}>
        {directoryData && (
          <TreeView
            node={directoryData}
            selectedFilePath={selectedFilePath}
            handleSelect={handleSelect}
            deleteNode={deleteNode}
            defaultExpanded={defaultExpanded}
          />
        )}
      </Box>
    </Drawer>
  )
}

export default SideBar
