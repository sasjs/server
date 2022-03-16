import React, { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import axios from 'axios'

import CssBaseline from '@mui/material/CssBaseline'
import Box from '@mui/material/Box'

import SideBar from './sideBar'
import Main from './main'

export interface TreeNode {
  name: string
  relativePath: string
  absolutePath: string
  children: Array<TreeNode>
}

const Drive = () => {
  const location = useLocation()
  const baseUrl = window.location.origin

  const [selectedFilePath, setSelectedFilePath] = useState('')
  const [directoryData, setDirectoryData] = useState<TreeNode | null>(null)

  const setFilePathOnMount = useCallback(() => {
    const queryParams = new URLSearchParams(location.search)
    setSelectedFilePath(queryParams.get('filePath') ?? '')
  }, [location.search])

  useEffect(() => {
    axios
      .get(`/SASjsApi/drive/fileTree`)
      .then((res: any) => {
        if (res.data && res.data?.status === 'success') {
          setDirectoryData(res.data.tree)
        }
      })
      .catch((err) => {
        console.log(err)
      })
    setFilePathOnMount()
  }, [setFilePathOnMount])

  const handleSelect = (node: TreeNode) => {
    if (node.children.length) return

    if (!node.name.includes('.')) return

    window.history.pushState(
      '',
      '',
      `${baseUrl}/#/SASjsDrive?filePath=${node.relativePath}`
    )
    setSelectedFilePath(node.relativePath)
  }

  const removeFileFromTree = (path: string) => {
    if (directoryData) {
      const newTree = JSON.parse(JSON.stringify(directoryData)) as TreeNode
      findAndRemoveNode(newTree, newTree, path)
      setDirectoryData(newTree)
    }
  }

  const findAndRemoveNode = (
    node: TreeNode,
    parentNode: TreeNode,
    path: string
  ) => {
    if (node.relativePath === path) {
      removeNodeFromParent(parentNode, path)
      return true
    }
    if (Array.isArray(node.children)) {
      for (let i = 0; i < node.children.length; i++) {
        if (findAndRemoveNode(node.children[i], node, path)) return
      }
    }
  }

  const removeNodeFromParent = (parent: TreeNode, path: string) => {
    const index = parent.children.findIndex(
      (node) => node.relativePath === path
    )
    if (index !== -1) {
      parent.children.splice(index, 1)
    }
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <SideBar directoryData={directoryData} handleSelect={handleSelect} />
      <Main
        selectedFilePath={selectedFilePath}
        removeFileFromTree={removeFileFromTree}
      />
    </Box>
  )
}

export default Drive
