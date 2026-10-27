import React, { useState } from 'react'
import { Menu, MenuItem, Typography } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView'
import { TreeItem } from '@mui/x-tree-view/TreeItem'

import DeleteConfirmationModal from './deleteConfirmationModal'
import NameInputModal from './nameInputModal'

import { LOADING_SUFFIX, childrenOf } from '../utils/driveTree'
import { TreeNode } from '../utils/types'

interface Props {
  node: TreeNode
  handleSelect: (path: string) => void
  deleteNode: (path: string, isFolder: boolean) => void
  addFile: (path: string) => void
  addFolder: (path: string) => void
  rename: (oldPath: string, newPath: string) => void
}

interface TreeViewProps extends Props {
  /** Drive-relative paths of the folders currently expanded. */
  expanded: string[]
  onExpandedChange: (expandedPaths: string[]) => void
}

interface ContextMenuState {
  node: TreeNode
  mouseX: number
  mouseY: number
}

/**
 * The dialog the tree has open, if any.
 *
 * One dialog lives at the tree level rather than one per row: a drive with a few
 * hundred entries used to mount a menu and two dialogs for every one of them.
 */
type DialogState =
  | { kind: 'delete'; node: TreeNode }
  | {
      kind: 'name'
      node: TreeNode
      title: string
      actionLabel: 'Add' | 'Rename'
      isFolder: boolean
    }
  | null

// MUI X requires a non-empty itemId, and the drive root's relativePath is the
// empty string, so the root is addressed by this constant instead.
const ROOT_ITEM_ID = 'sasjs-drive-root'
const itemIdFor = (relativePath: string) =>
  relativePath === '' ? ROOT_ITEM_ID : relativePath
const relativePathFor = (itemId: string) =>
  itemId === ROOT_ITEM_ID ? '' : itemId

const TreeView = ({
  node,
  handleSelect,
  deleteNode,
  addFile,
  addFolder,
  rename,
  expanded,
  onExpandedChange
}: TreeViewProps) => {
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [dialog, setDialog] = useState<DialogState>(null)

  const openContextMenu = (event: React.MouseEvent, target: TreeNode) => {
    event.preventDefault()
    event.stopPropagation()

    setContextMenu(
      contextMenu === null
        ? {
            node: target,
            mouseX: event.clientX + 2,
            mouseY: event.clientY - 6
          }
        : null
    )
  }

  const closeContextMenu = (event: any) => {
    event.stopPropagation()
    setContextMenu(null)
  }

  const handleItemClick = (event: React.MouseEvent, target: TreeNode) => {
    if (target.isFolder) return
    if (target.relativePath.endsWith(LOADING_SUFFIX)) return

    handleSelect(target.relativePath)
  }

  const launch = (
    event: React.MouseEvent | null,
    target: TreeNode,
    debug?: boolean
  ) => {
    event?.stopPropagation()
    setContextMenu(null)

    window.open(
      `${window.location.origin}/SASjsApi/stp/execute?_program=${
        target.relativePath
      }${debug ? '&_debug=131' : ''}`
    )
  }

  const confirmDelete = () => {
    if (dialog?.kind !== 'delete') return

    deleteNode(dialog.node.relativePath, dialog.node.isFolder)
    setDialog(null)
  }

  const submitName = (name: string) => {
    if (dialog?.kind !== 'name') return

    const target = dialog.node
    setDialog(null)

    if (dialog.actionLabel === 'Add') {
      const createdPath = `${target.relativePath}/${name}`

      if (dialog.isFolder) addFolder(createdPath)
      else addFile(createdPath)

      return
    }

    const segments = target.relativePath.split('/')
    segments.splice(-1, 1, name)

    rename(target.relativePath, segments.join('/'))
  }

  const renderTree = (nodes: TreeNode) => (
    <TreeItem
      key={nodes.relativePath}
      itemId={itemIdFor(nodes.relativePath)}
      // On the ITEM, not on the label: the label is only as wide as the name, so
      // a right-click on the rest of the row - where a user naturally clicks -
      // used to do nothing at all.
      onContextMenu={(event) => openContextMenu(event, nodes)}
      label={
        <Typography onClick={(event) => handleItemClick(event, nodes)}>
          {nodes.name}
        </Typography>
      }
    >
      {childrenOf(nodes).map((child) => renderTree(child))}
    </TreeItem>
  )

  const menuNode = contextMenu?.node

  return (
    <>
      <SimpleTreeView
        slots={{
          collapseIcon: ExpandMoreIcon,
          expandIcon: ChevronRightIcon
        }}
        expandedItems={expanded.map(itemIdFor)}
        onExpandedItemsChange={(_event, itemIds) =>
          onExpandedChange(itemIds.map(relativePathFor))
        }
        sx={{ flexGrow: 1, maxWidth: 400, overflowY: 'auto' }}
      >
        {renderTree(node)}
      </SimpleTreeView>

      <Menu
        open={contextMenu !== null}
        onClose={closeContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        {menuNode?.isFolder ? (
          <>
            <MenuItem
              onClick={() => {
                setContextMenu(null)
                setDialog({
                  kind: 'name',
                  node: menuNode,
                  title: 'Add Folder',
                  actionLabel: 'Add',
                  isFolder: true
                })
              }}
            >
              Add Folder
            </MenuItem>
            <MenuItem
              disabled={!menuNode.relativePath}
              onClick={() => {
                setContextMenu(null)
                setDialog({
                  kind: 'name',
                  node: menuNode,
                  title: 'Add File',
                  actionLabel: 'Add',
                  isFolder: false
                })
              }}
            >
              Add File
            </MenuItem>
          </>
        ) : (
          <>
            <MenuItem onClick={(event) => launch(event, menuNode!)}>
              Launch
            </MenuItem>
            <MenuItem onClick={(event) => launch(event, menuNode!, true)}>
              Launch and Debug
            </MenuItem>
          </>
        )}
        {!!menuNode?.relativePath && (
          <>
            <MenuItem
              onClick={() => {
                setContextMenu(null)
                setDialog({
                  kind: 'name',
                  node: menuNode,
                  title: 'Rename',
                  actionLabel: 'Rename',
                  isFolder: menuNode.isFolder
                })
              }}
            >
              Rename
            </MenuItem>
            <MenuItem
              onClick={() => {
                setContextMenu(null)
                setDialog({ kind: 'delete', node: menuNode })
              }}
            >
              Delete
            </MenuItem>
          </>
        )}
      </Menu>

      <DeleteConfirmationModal
        open={dialog?.kind === 'delete'}
        setOpen={(open) => (open ? undefined : setDialog(null))}
        message={
          dialog?.kind === 'delete'
            ? dialog.node.isFolder
              ? `Are you sure you want to delete the folder "${dialog.node.relativePath}" and everything under it?`
              : `Are you sure you want to delete the file "${dialog.node.relativePath}"?`
            : ''
        }
        _delete={confirmDelete}
      />

      <NameInputModal
        open={dialog?.kind === 'name'}
        setOpen={(open) => (open ? undefined : setDialog(null))}
        title={dialog?.kind === 'name' ? dialog.title : ''}
        isFolder={dialog?.kind === 'name' ? dialog.isFolder : false}
        actionLabel={dialog?.kind === 'name' ? dialog.actionLabel : 'Add'}
        action={submitName}
        defaultName={
          dialog?.kind === 'name' && dialog.actionLabel === 'Rename'
            ? (dialog.node.relativePath.split('/').pop() ?? '')
            : ''
        }
      />
    </>
  )
}

export default TreeView
