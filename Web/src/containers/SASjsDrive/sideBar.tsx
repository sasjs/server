import React, { useState, useEffect } from 'react'
import axios from 'axios'

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

interface TreeNode {
  path: string
  name: string
  children?: readonly TreeNode[]
}

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

const SideBar = (props: any) => {
  const baseUrl = window.location.origin
  const classes = useStyles()

  const [directoryData, setDirectoryData] = useState<TreeNode | null>(null)

  useEffect(() => {
    axios.get(`${baseUrl}/SASjsExecutor`).then((res: any) => {
      if (res.data && res.data?.status === 'success') {
        setDirectoryData(res.data.tree)
      }
    })
  }, [])

  const handleSelect = (node: TreeNode) => {
    if (!node.children) {
      window.history.pushState(
        '',
        '',
        `${baseUrl}/SASjsDrive?filepath=${node.path}`
      )
      props.setSelectedFilePath(node.path)
    }
  }

  const renderTree = (nodes: TreeNode) => (
    <TreeItem
      classes={{ root: classes.root }}
      key={nodes.path}
      nodeId={nodes.path}
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
        <TreeView
          defaultCollapseIcon={<ExpandMoreIcon />}
          defaultExpandIcon={<ChevronRightIcon />}
        >
          {directoryData && renderTree(directoryData)}
        </TreeView>
      </Box>
    </Drawer>
  )
}

export default SideBar
