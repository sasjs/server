import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import axios from 'axios'

import CssBaseline from '@mui/material/CssBaseline'
import Box from '@mui/material/Box'

import { TreeNode } from '../../utils/types'

import SideBar from './sideBar'
import SASjsEditor from './editor'

const Studio = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedFilePath, setSelectedFilePath] = useState('')
  const [directoryData, setDirectoryData] = useState<TreeNode | null>(null)
  const [tab, setTab] = useState('code')

  useEffect(() => {
    setSelectedFilePath(searchParams.get('filePath') ?? '')
  }, [searchParams])

  const fetchDirectoryData = useCallback(() => {
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
  }, [])

  useEffect(() => {
    fetchDirectoryData()
  }, [fetchDirectoryData])

  const handleSelect = (filePath: string, refreshSideBar?: boolean) => {
    setSearchParams({ filePath })
    if (refreshSideBar) fetchDirectoryData()
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
      // reset selected file path and file path query param
      if (
        node.relativePath === selectedFilePath ||
        selectedFilePath.startsWith(node.relativePath)
      )
        setSearchParams({})
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
      {tab === 'code' && (
        <SideBar
          selectedFilePath={selectedFilePath}
          directoryData={directoryData}
          handleSelect={handleSelect}
          removeFileFromTree={removeFileFromTree}
          refreshSideBar={fetchDirectoryData}
        />
      )}
      <SASjsEditor
        selectedFilePath={selectedFilePath}
        setSelectedFilePath={handleSelect}
        tab={tab}
        setTab={setTab}
      />
    </Box>
  )
}

export default Studio
