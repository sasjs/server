import React, { useMemo } from 'react'

import { makeStyles } from '@mui/styles'

import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import Toolbar from '@mui/material/Toolbar'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'

import TreeView from '@mui/lab/TreeView'
import TreeItem from '@mui/lab/TreeItem'

import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'

import { TreeNode } from '.'

const useStyles = makeStyles(() => ({
  root: {
    '& .MuiTreeItem-content': {
      width: 'auto'
    }
  },
  listItem: {
    padding: 0
  }
}))

const drawerWidth = 240

type Props = {
  selectedFilePath: string
  directoryData: TreeNode | null
  handleSelect: (node: TreeNode) => void
}

const SideBar = ({ selectedFilePath, directoryData, handleSelect }: Props) => {
  const classes = useStyles()

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

  const renderTree = (nodes: TreeNode) => (
    <TreeItem
      classes={{ root: classes.root }}
      key={nodes.relativePath}
      nodeId={nodes.relativePath}
      label={
        <ListItem
          className={classes.listItem}
          onClick={() => handleSelect(nodes)}
        >
          <ListItemText primary={nodes.name} />
        </ListItem>
      }
    >
      {Array.isArray(nodes.children)
        ? nodes.children.map((node) => renderTree(node))
        : null}
    </TreeItem>
  )

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
            defaultCollapseIcon={<ExpandMoreIcon />}
            defaultExpandIcon={<ChevronRightIcon />}
            defaultExpanded={defaultExpanded}
            selected={defaultExpanded.slice(-1)}
          >
            {renderTree(directoryData)}
          </TreeView>
        )}
      </Box>
    </Drawer>
  )
}

export default SideBar
