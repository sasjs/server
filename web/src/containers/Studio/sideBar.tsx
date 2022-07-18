import React, { useMemo } from 'react'

import { Box, Drawer, Toolbar } from '@mui/material'

import TreeView from '../../components/tree'
import { TreeNode } from '../../utils/types'

const drawerWidth = 240

type Props = {
  selectedFilePath: string
  directoryData: TreeNode | null
  handleSelect: (filePath: string) => void
}

const SideBar = ({ selectedFilePath, directoryData, handleSelect }: Props) => {
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
            defaultExpanded={defaultExpanded}
          />
        )}
      </Box>
    </Drawer>
  )
}

export default SideBar
