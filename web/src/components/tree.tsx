import React, { useEffect, useState } from 'react'
import { Menu, MenuItem } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'

import { TreeNode } from '../utils/types'

type TreeViewProps = {
  node: TreeNode
  selectedFilePath: string
  handleSelect: (filePath: string) => void
  defaultExpanded?: string[]
}

const TreeView = ({
  node,
  selectedFilePath,
  handleSelect,
  defaultExpanded
}: TreeViewProps) => {
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
        defaultExpanded={defaultExpanded}
      />
    </ul>
  )
}

export default TreeView

type TreeViewNodeProps = {
  node: TreeNode
  selectedFilePath: string
  handleSelect: (filePath: string) => void
  defaultExpanded?: string[]
}

const TreeViewNode = ({
  node,
  selectedFilePath,
  handleSelect,
  defaultExpanded
}: TreeViewNodeProps) => {
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
              defaultExpanded={defaultExpanded}
            />
          ))}
      </li>
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
            <MenuItem key={item}>{item}</MenuItem>
          ))}
        <MenuItem>Rename</MenuItem>
        <MenuItem>Delete</MenuItem>
      </Menu>
    </div>
  )
}
