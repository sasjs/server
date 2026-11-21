import { useMemo, useState } from 'react'

import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material'
import { Search as SearchIcon } from '@mui/icons-material'

import FileTypeIcon from './fileTypeIcon'
import { LOADING_SUFFIX, childrenOf } from '../utils/driveTree'
import {
  breadcrumbOf,
  filterChildren,
  folderStats,
  formatBytes,
  formatWhen,
  inFolderOrder,
  totalBytes
} from '../utils/folderView'
import type { TreeNode } from '../utils/types'

interface Props {
  /** The folder's path, as the URL names it - '' is the drive root. */
  path: string
  /** The node the tree holds for it, or null until that level has been read. */
  node: TreeNode | null
  /** Opens a file in the editor. */
  onOpenFile: (filePath: string) => void
  /** Goes to a folder - a crumb, or a folder in the listing. */
  onOpenFolder: (folderPath: string) => void
  /** Hands this folder to the header's search box, which searches the bodies too. */
  onSearchInside: (folderPath: string) => void
}

/**
 * The page a folder opens to: where you are, what is in it, and how to search it.
 *
 * The tree answers "where is the file I want" one level at a time; a reader who
 * clicks a folder is asking a different question - "what is in here" - and until
 * now the answer was the folder's name and a sentence. This page answers it: the
 * counts and dates of the level the tree has already read (no request of its own),
 * a filter over the names, a way into the contents search, and the listing with
 * each file's own dates.
 *
 * Sizes come from the tree when the host reports them. The drive's tree does not
 * today, so the column and the total are simply absent rather than zero - a size
 * column reading "0 B" on every row would be a lie about every file in it.
 */
const FolderView = ({
  path,
  node,
  onOpenFile,
  onOpenFolder,
  onSearchInside
}: Props) => {
  const [filter, setFilter] = useState('')

  const children = useMemo(
    () =>
      node
        ? inFolderOrder(
            childrenOf(node).filter(
              (child) => !child.relativePath.endsWith(LOADING_SUFFIX)
            )
          )
        : [],
    [node]
  )

  const stats = useMemo(() => folderStats(children), [children])
  const bytes = useMemo(() => totalBytes(children), [children])
  const shown = useMemo(
    () => filterChildren(children, filter),
    [children, filter]
  )
  const crumbs = useMemo(() => breadcrumbOf(path), [path])
  const hasSizes = children.some((child) => typeof child.size === 'number')
  const name = crumbs[crumbs.length - 1].name

  const summary = [
    `${stats.files} file${stats.files === 1 ? '' : 's'}`,
    `${stats.folders} folder${stats.folders === 1 ? '' : 's'}`,
    bytes === null ? '' : formatBytes(bytes),
    stats.newest ? `last change ${formatWhen(stats.newest)}` : ''
  ].filter(Boolean)

  const open = (child: TreeNode) =>
    child.isFolder
      ? onOpenFolder(child.relativePath)
      : onOpenFile(child.relativePath)

  return (
    <Box sx={{ p: 2, maxWidth: 960 }}>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'baseline',
          gap: 0.5
        }}
      >
        {crumbs.map((crumb, index) => {
          const last = index === crumbs.length - 1

          return (
            <Box key={crumb.path || 'root'} sx={{ display: 'flex', gap: 0.5 }}>
              {index > 0 && (
                <Typography variant="body2" color="text.secondary">
                  /
                </Typography>
              )}
              <Typography
                variant="body2"
                component={last ? 'span' : 'button'}
                onClick={last ? undefined : () => onOpenFolder(crumb.path)}
                sx={
                  last
                    ? { color: 'text.primary' }
                    : {
                        border: 0,
                        p: 0,
                        background: 'none',
                        cursor: 'pointer',
                        color: 'primary.main',
                        font: 'inherit'
                      }
                }
              >
                {crumb.name}
              </Typography>
            </Box>
          )
        })}
      </Box>

      <Typography variant="h6" sx={{ mt: 1 }}>
        {name}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {node ? summary.join(' · ') : 'Reading this folder…'}
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, my: 2 }}>
        <TextField
          size="small"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Filter this folder"
          // only offered once there is something to filter
          disabled={!children.length}
          slotProps={{
            htmlInput: { 'aria-label': `Filter the files in ${name}` }
          }}
          sx={{ width: 260 }}
        />
        <Button
          variant="outlined"
          size="small"
          startIcon={<SearchIcon />}
          onClick={() => onSearchInside(path)}
        >
          Search inside these files
        </Button>
      </Box>

      {!node ? null : !children.length ? (
        <Typography variant="body2" color="text.secondary">
          This folder is empty.
        </Typography>
      ) : !shown.length ? (
        <Typography variant="body2" color="text.secondary">
          Nothing in this folder matches “{filter.trim()}”.
        </Typography>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                {hasSizes && <TableCell align="right">Size</TableCell>}
                <TableCell>Created</TableCell>
                <TableCell>Modified</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {shown.map((child) => (
                <TableRow
                  key={child.relativePath}
                  hover
                  onClick={() => open(child)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FileTypeIcon
                        filePath={child.relativePath}
                        isFolder={child.isFolder}
                      />
                      {child.name}
                    </Box>
                  </TableCell>
                  {hasSizes && (
                    <TableCell align="right">
                      {typeof child.size === 'number' && !child.isFolder
                        ? formatBytes(child.size)
                        : ''}
                    </TableCell>
                  )}
                  <TableCell>{formatWhen(child.created)}</TableCell>
                  <TableCell>{formatWhen(child.modified)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  )
}

export default FolderView
