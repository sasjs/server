import { useMemo, useState } from 'react'

import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material'

import FileTypeIcon from './fileTypeIcon'
import FolderSearch from './folderSearch'
import { LOADING_SUFFIX, childrenOf } from '../utils/driveTree'
import {
  breadcrumbOf,
  folderStats,
  formatBytes,
  formatWhen,
  inFolderOrder,
  totalBytes
} from '../utils/folderView'
import type { TreeNode } from '../utils/types'
import { isSearchQuery } from '../utils/search'

interface Props {
  /** The folder's path, as the URL names it - '' is the drive root. */
  path: string
  /** The node the tree holds for it, or null until that level has been read. */
  node: TreeNode | null
  /** Opens a file in the editor. */
  onOpenFile: (filePath: string) => void
  /** Goes to a folder - a crumb, or a folder in the listing. */
  onOpenFolder: (folderPath: string) => void
  /** Puts the cursor in the search box when the page was opened to search it. */
  focusSearch?: boolean
}

/**
 * The page a folder opens to: where you are, what is in it, and how to search it.
 *
 * The tree answers "where is the file I want" one level at a time, and a reader who
 * clicks a folder is asking a different question - "what is in here". This page
 * answers it: the counts and dates of the level the tree has already read (no
 * request of its own), the folder's own search - names and contents, recursively -
 * and the listing with each file's own dates.
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
  focusSearch
}: Props) => {
  // This page has exactly one search box, and it answers for this folder: the
  // names of the folders and files beneath it, and the text inside those files,
  // recursively. The query is held here rather than in the box so the page can tell
  // whether a search is running.
  const [search, setSearch] = useState({ path, value: '' })
  const query = search.path === path ? search.value : ''
  const setQuery = (value: string) => setSearch({ path, value })

  // Reset synchronously on a path change, before the new page can accept input.
  // A passive effect could clear a query typed after the new field appeared.
  if (search.path !== path) setSearch({ path, value: '' })

  const searching = isSearchQuery(query)

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

  // Whether the level has actually been read, which is not the same as an empty
  // one. `childrenOf` answers a loading placeholder for a folder the API reported
  // contents for, so the node is what says it - not the children this page got back:
  // an unread level and an empty one both look like no children.
  const read = !!node && (!!node.childrenLoaded || !node.hasChildren)

  const stats = useMemo(() => folderStats(children), [children])
  const bytes = useMemo(() => totalBytes(children), [children])

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

      <Box sx={{ my: 2 }}>
        {/* The folder's own search, here rather than in the header: a reader who has
            opened a folder is looking at THIS folder, and the box that answers for it
            belongs where they are looking. It is the page's only search box, and it
            covers this folder's names and the text inside its files, recursively. */}
        <FolderSearch
          folder={path}
          name={name}
          query={query}
          onQueryChange={setQuery}
          autoFocus={focusSearch}
          onOpenFile={onOpenFile}
          onOpenFolder={onOpenFolder}
        />
      </Box>

      {/* While a query is being answered the results stand in for the listing: the
          search covers the folders under this one, so a listing of this level beside
          it would be a different, narrower set of rows under the same box. */}
      {searching ? null : !node ? null : !read ? (
        <Typography variant="body2" color="text.secondary">
          Reading this folder…
        </Typography>
      ) : !children.length ? (
        <Typography variant="body2" color="text.secondary">
          This folder is empty.
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
              {children.map((child) => (
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
