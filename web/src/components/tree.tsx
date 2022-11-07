import React, { useState } from 'react'
import { Menu, MenuItem, Typography } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import MuiTreeView from '@mui/lab/TreeView'
import MuiTreeItem from '@mui/lab/TreeItem'

import DeleteConfirmationModal from './deleteConfirmationModal'
import NameInputModal from './nameInputModal'

import { TreeNode } from '../utils/types'

interface Props {
  node: TreeNode
  handleSelect: (filePath: string) => void
  deleteNode: (path: string, isFolder: boolean) => void
  addFile: (path: string) => void
  addFolder: (path: string) => void
  rename: (oldPath: string, newPath: string) => void
}

interface TreeViewProps extends Props {
  defaultExpanded?: string[]
}

const TreeView = ({
  node,
  handleSelect,
  deleteNode,
  addFile,
  addFolder,
  rename,
  defaultExpanded
}: TreeViewProps) => {
  const renderTree = (nodes: TreeNode) => (
    <MuiTreeItem
      key={nodes.relativePath}
      nodeId={nodes.relativePath}
      label={
        <TreeItemWithContextMenu
          node={nodes}
          handleSelect={handleSelect}
          deleteNode={deleteNode}
          addFile={addFile}
          addFolder={addFolder}
          rename={rename}
        />
      }
    >
      {Array.isArray(nodes.children)
        ? nodes.children.map((node) => renderTree(node))
        : null}
    </MuiTreeItem>
  )

  return (
    <MuiTreeView
      defaultCollapseIcon={<ExpandMoreIcon />}
      defaultExpandIcon={<ChevronRightIcon />}
      defaultExpanded={defaultExpanded}
      sx={{ flexGrow: 1, maxWidth: 400, overflowY: 'auto' }}
    >
      {renderTree(node)}
    </MuiTreeView>
  )
}

export default TreeView

const TreeItemWithContextMenu = ({
  node,
  handleSelect,
  deleteNode,
  addFile,
  addFolder,
  rename
}: Props) => {
  const [deleteConfirmationModalOpen, setDeleteConfirmationModalOpen] =
    useState(false)
  const [deleteConfirmationModalMessage, setDeleteConfirmationModalMessage] =
    useState('')
  const [defaultInputModalName, setDefaultInputModalName] = useState('')
  const [nameInputModalOpen, setNameInputModalOpen] = useState(false)
  const [nameInputModalTitle, setNameInputModalTitle] = useState('')
  const [nameInputModalActionLabel, setNameInputModalActionLabel] = useState('')
  const [nameInputModalForFolder, setNameInputModalForFolder] = useState(false)
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number
    mouseY: number
  } | null>(null)

  const launchProgram = (event: React.MouseEvent) => {
    event.stopPropagation()
    const baseUrl = window.location.origin
    window.open(`${baseUrl}/SASjsApi/stp/execute?_program=${node.relativePath}`)
  }

  const launchProgramWithDebug = (event: React.MouseEvent) => {
    event.stopPropagation()
    const baseUrl = window.location.origin
    window.open(
      `${baseUrl}/SASjsApi/stp/execute?_program=${node.relativePath}&_debug=131`
    )
  }

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setContextMenu(
      contextMenu === null
        ? {
            mouseX: event.clientX + 2,
            mouseY: event.clientY - 6
          }
        : null
    )
  }

  const handleClose = (event: any) => {
    event.stopPropagation()
    setContextMenu(null)
  }

  const handleItemClick = (event: React.MouseEvent) => {
    if (node.children.length) return
    handleSelect(node.relativePath)
  }

  const handleDeleteItemClick = (event: React.MouseEvent) => {
    event.stopPropagation()
    setContextMenu(null)
    setDeleteConfirmationModalOpen(true)
    setDeleteConfirmationModalMessage(
      `Are you sure you want to delete ${node.isFolder ? 'folder' : 'file'} "${
        node.relativePath
      }"?`
    )
  }

  const deleteConfirm = () => {
    setDeleteConfirmationModalOpen(false)
    deleteNode(node.relativePath, node.isFolder)
  }

  const handleNewFolderItemClick = (event: React.MouseEvent) => {
    event.stopPropagation()
    setContextMenu(null)
    setNameInputModalOpen(true)
    setNameInputModalTitle('Add Folder')
    setNameInputModalActionLabel('Add')
    setNameInputModalForFolder(true)
    setDefaultInputModalName('')
  }

  const handleNewFileItemClick = (event: React.MouseEvent) => {
    event.stopPropagation()
    setContextMenu(null)
    setNameInputModalOpen(true)
    setNameInputModalTitle('Add File')
    setNameInputModalActionLabel('Add')
    setNameInputModalForFolder(false)
    setDefaultInputModalName('')
  }

  const addFileFolder = (name: string) => {
    setNameInputModalOpen(false)
    const path = node.relativePath + '/' + name
    if (nameInputModalForFolder) addFolder(path)
    else addFile(path)
  }

  const handleRenameItemClick = (event: React.MouseEvent) => {
    event.stopPropagation()
    setContextMenu(null)
    setNameInputModalOpen(true)
    setNameInputModalTitle('Rename')
    setNameInputModalActionLabel('Rename')
    setNameInputModalForFolder(node.isFolder)
    setDefaultInputModalName(node.relativePath.split('/').pop() ?? '')
  }

  const renameFileFolder = (name: string) => {
    setNameInputModalOpen(false)
    const oldPath = node.relativePath
    const splittedPath = node.relativePath.split('/')
    splittedPath.splice(-1, 1, name)
    const newPath = splittedPath.join('/')
    rename(oldPath, newPath)
  }

  return (
    <div onContextMenu={handleContextMenu} style={{ cursor: 'context-menu' }}>
      <Typography onClick={handleItemClick}>{node.name}</Typography>
      <DeleteConfirmationModal
        open={deleteConfirmationModalOpen}
        setOpen={setDeleteConfirmationModalOpen}
        message={deleteConfirmationModalMessage}
        _delete={deleteConfirm}
      />
      <NameInputModal
        open={nameInputModalOpen}
        setOpen={setNameInputModalOpen}
        title={nameInputModalTitle}
        isFolder={nameInputModalForFolder}
        actionLabel={nameInputModalActionLabel}
        action={
          nameInputModalActionLabel === 'Add' ? addFileFolder : renameFileFolder
        }
        defaultName={defaultInputModalName}
      />
      <Menu
        open={contextMenu !== null}
        onClose={handleClose}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        {node.isFolder ? (
          <>
            <MenuItem onClick={handleNewFolderItemClick}>Add Folder</MenuItem>
            <MenuItem
              disabled={!node.relativePath}
              onClick={handleNewFileItemClick}
            >
              Add File
            </MenuItem>
          </>
        ) : (
          <>
            <MenuItem onClick={launchProgram}>Launch</MenuItem>
            <MenuItem onClick={launchProgramWithDebug}>
              Launch and Debug
            </MenuItem>
          </>
        )}
        {!!node.relativePath && (
          <>
            <MenuItem onClick={handleRenameItemClick}>Rename</MenuItem>
            <MenuItem onClick={handleDeleteItemClick}>Delete</MenuItem>
          </>
        )}
      </Menu>
    </div>
  )
}
