import React, { useEffect, useState } from 'react'
import { Menu, MenuItem } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'

import DeleteConfirmationModal from './deleteConfirmationModal'
import NameInputModal from './nameInputModal'

import { TreeNode } from '../utils/types'

type Props = {
  node: TreeNode
  selectedFilePath: string
  handleSelect: (filePath: string) => void
  deleteNode: (path: string, isFolder: boolean) => void
  addFile: (path: string) => void
  addFolder: (path: string) => void
  defaultExpanded?: string[]
}

const TreeView = ({
  node,
  selectedFilePath,
  handleSelect,
  deleteNode,
  addFile,
  addFolder,
  defaultExpanded
}: Props) => {
  return (
    <ul
      style={{
        listStyle: 'none',
        padding: '0.75rem 1.25rem',
        width: 'max-content'
      }}
    >
      <TreeViewNode
        node={node}
        selectedFilePath={selectedFilePath}
        handleSelect={handleSelect}
        deleteNode={deleteNode}
        addFile={addFile}
        addFolder={addFolder}
        defaultExpanded={defaultExpanded}
      />
    </ul>
  )
}

export default TreeView

const TreeViewNode = ({
  node,
  selectedFilePath,
  handleSelect,
  deleteNode,
  addFile,
  addFolder,
  defaultExpanded
}: Props) => {
  const [deleteConfirmationModalOpen, setDeleteConfirmationModalOpen] =
    useState(false)
  const [deleteConfirmationModalMessage, setDeleteConfirmationModalMessage] =
    useState('')
  const [nameInputModalOpen, setNameInputModalOpen] = useState(false)
  const [nameInputModalForFolder, setNameInputModalForFolder] = useState(false)
  const [childVisible, setChildVisibility] = useState(false)
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number
    mouseY: number
  } | null>(null)

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

  const hasChild = node.children.length ? true : false

  const handleItemClick = () => {
    if (node.children.length) {
      setChildVisibility((v) => !v)
      return
    }

    if (!node.name.includes('.')) return

    handleSelect(node.relativePath)
  }

  useEffect(() => {
    if (defaultExpanded && defaultExpanded[0] === node.relativePath) {
      setChildVisibility(true)
      defaultExpanded.shift()
    }
  }, [defaultExpanded, node.relativePath])

  const handleDeleteItemClick = () => {
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

  const handleNewFolderItemClick = () => {
    setContextMenu(null)
    setNameInputModalOpen(true)
    setNameInputModalForFolder(true)
  }

  const handleNewFileItemClick = () => {
    setContextMenu(null)
    setNameInputModalOpen(true)
    setNameInputModalForFolder(false)
  }

  const addFileFolder = (name: string) => {
    setNameInputModalOpen(false)
    const path = node.relativePath + '/' + name
    if (nameInputModalForFolder) addFolder(path)
    else addFile(path)
  }

  return (
    <div onContextMenu={handleContextMenu} style={{ cursor: 'context-menu' }}>
      <li style={{ display: 'list-item' }}>
        <div
          className={`tree-item-label ${
            selectedFilePath === node.relativePath ? 'selected' : ''
          }`}
          onClick={() => handleItemClick()}
        >
          {hasChild &&
            (childVisible ? <ExpandMoreIcon /> : <ChevronRightIcon />)}
          <div>{node.name}</div>
        </div>

        {hasChild &&
          childVisible &&
          node.children.map((child, index) => (
            <TreeView
              key={node.relativePath + '-' + index}
              node={child}
              selectedFilePath={selectedFilePath}
              handleSelect={handleSelect}
              deleteNode={deleteNode}
              addFile={addFile}
              addFolder={addFolder}
              defaultExpanded={defaultExpanded}
            />
          ))}
      </li>
      <DeleteConfirmationModal
        open={deleteConfirmationModalOpen}
        setOpen={setDeleteConfirmationModalOpen}
        message={deleteConfirmationModalMessage}
        _delete={deleteConfirm}
      />
      <NameInputModal
        open={nameInputModalOpen}
        setOpen={setNameInputModalOpen}
        isFolder={nameInputModalForFolder}
        add={addFileFolder}
      />
      <Menu
        open={contextMenu !== null}
        onClose={() => setContextMenu(null)}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        {node.isFolder &&
          ['Add Folder', 'Add File'].map((item) => (
            <MenuItem
              key={item}
              onClick={() =>
                item === 'Add Folder'
                  ? handleNewFolderItemClick()
                  : handleNewFileItemClick()
              }
            >
              {item}
            </MenuItem>
          ))}
        <MenuItem>Rename</MenuItem>
        <MenuItem disabled={!node.relativePath} onClick={handleDeleteItemClick}>
          Delete
        </MenuItem>
      </Menu>
    </div>
  )
}
