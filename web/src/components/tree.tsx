import React, { useState } from 'react'
import { Box, Menu, MenuItem, Typography } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView'
import { TreeItem } from '@mui/x-tree-view/TreeItem'

import FileTypeIcon from './fileTypeIcon'
import DeleteConfirmationModal from './deleteConfirmationModal'
import NameInputModal from './nameInputModal'

import {
  LOADING_SUFFIX,
  ROOT_PATH,
  childrenOf,
  isDriveRootPath
} from '../utils/driveTree'
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

    // Always the row that was clicked. This used to toggle, keeping the
    // PREVIOUS node whenever a menu was already open, so a right-click on a
    // second row could leave the menu acting on the first one - and whether it
    // did depended on the backdrop's onClose running before or after this.
    setContextMenu({
      node: target,
      mouseX: event.clientX + 2,
      mouseY: event.clientY - 6
    })
  }

  const closeContextMenu = (event: any) => {
    event.stopPropagation()
    setContextMenu(null)
  }

  const handleItemClick = (target: TreeNode) => {
    if (target.isFolder) return
    if (target.relativePath.endsWith(LOADING_SUFFIX)) return

    handleSelect(target.relativePath)
  }

  const launch = (target: TreeNode, debug?: boolean) => {
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

  /**
   * The times the server reported for a file, as a hover reads them. Absent for
   * a folder, and absent for a drive whose filesystem reports no birth time -
   * the tooltip states what it has rather than a date it made up.
   */
  const describeTimes = (node: TreeNode): string | undefined => {
    if (node.isFolder) return undefined

    const asRead = (iso?: string) => {
      if (!iso) return ''

      const when = new Date(iso)
      if (isNaN(when.getTime())) return ''

      return when.toLocaleString()
    }

    const created = asRead(node.created)
    const modified = asRead(node.modified)

    return [created && `created ${created}`, modified && `modified ${modified}`]
      .filter(Boolean)
      .join(', ')
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
        <Typography
          onClick={() => handleItemClick(nodes)}
          title={describeTimes(nodes)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            // the icon is 18px and the row is 22px: centre it on the name
            // rather than letting it set the line box's height
            lineHeight: 1.4
          }}
        >
          <FileTypeIcon
            filePath={nodes.relativePath}
            isFolder={nodes.isFolder}
          />
          {nodes.name}
        </Typography>
      }
    >
      {childrenOf(nodes).map((child) => renderTree(child))}
    </TreeItem>
  )

  const menuNode = contextMenu?.node

  // The drive root is the level the sidebar starts at, not a folder a reader
  // navigates into: its row said "files" and wrapped a single level whose own
  // names are the ones a reader is looking for. Its children are the top-level
  // rows, so the first level is open on load.
  //
  // The root is matched by BOTH spellings because the two hosts disagree about
  // it: `normaliseDrivePath` in @sasjs/api answers `/` for the drive root (the
  // document says "the root is '/'"), which is what the browser host serves, so
  // on the published site the root's relativePath is `/` - while sasjs/server's
  // own `buildDirectoryLevel` answers `''`, and `driveTree`'s ROOT_PATH is `''`
  // to match. A tree keyed on `''` alone therefore left the root row out of
  // `expandedItems` on the browser host, which is why the row was collapsed
  // there (measured on server.sasjs.io: the root listed as
  // `{ name: 'files', relativePath: '/', isFolder: true }`).
  const tops = isDriveRootPath(node.relativePath, node.isFolder)
    ? childrenOf(node)
    : [node]

  return (
    <>
      <Box
        sx={{ flexGrow: 1, maxWidth: 400, overflowY: 'auto' }}
        // The root's own actions (add a file or a folder at the top of the
        // drive) used to live on the root row's context menu. With the row gone
        // they are here: a right-click on the empty part of the tree, below the
        // last row, is the drive itself.
        onContextMenu={(event) => {
          if (event.target !== event.currentTarget) return
          openContextMenu(event, node)
        }}
      >
        <SimpleTreeView
          slots={{
            collapseIcon: ExpandMoreIcon,
            expandIcon: ChevronRightIcon
          }}
          // the root is not a row any more, so neither spelling of it can be an
          // expanded item
          expandedItems={expanded
            .filter((path) => path !== ROOT_PATH && path !== '/')
            .map(itemIdFor)}
          onExpandedItemsChange={(_event, itemIds) =>
            onExpandedChange(itemIds.map(relativePathFor))
          }
          // no `sx` here: the Box above is the one that scrolls, and a second
          // scroll container inside it would only be `flexGrow`-inert
        >
          {tops.map((top) => renderTree(top))}
        </SimpleTreeView>
      </Box>

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
            <MenuItem onClick={() => launch(menuNode!)}>Launch</MenuItem>
            <MenuItem onClick={() => launch(menuNode!, true)}>
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
