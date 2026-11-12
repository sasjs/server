import React from 'react'
import Box from '@mui/material/Box'
import ArticleIcon from '@mui/icons-material/Article'
import CodeIcon from '@mui/icons-material/Code'
import DataObjectIcon from '@mui/icons-material/DataObject'
import DescriptionIcon from '@mui/icons-material/Description'
import FolderZipIcon from '@mui/icons-material/FolderZip'
import ImageIcon from '@mui/icons-material/Image'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'
import StorageIcon from '@mui/icons-material/Storage'
import TableChartIcon from '@mui/icons-material/TableChart'
import WebIcon from '@mui/icons-material/Web'

import SasjsMark, { FILE_ICON_SIZE } from './sasjsMark'
import { DriveFileKind, driveFileKindOf } from '../utils/files'

/**
 * The image for each kind of drive entry.
 *
 * Programs are the one kind drawn in the brand's own colours: the SASjs mark
 * says "this runs", which is the thing the tree exists to make obvious. The
 * rest are monochrome glyphs that inherit the row's colour, so they read the
 * same in the light and dark themes - they identify a file, they are not a
 * status.
 *
 * The glyphs are chosen for the question a reader asks of the tree - what is
 * this file - so a `.js` beside a `.sas` reads as another program (a code
 * bracket, not the SAS mark), a `.zip` reads as something to unpack, and a
 * `.csv` and a `.xlsx` read the same because they are the same thing to an
 * analyst.
 */
const ICONS: { [kind in Exclude<DriveFileKind, 'program'>]: any } = {
  script: CodeIcon,
  markup: WebIcon,
  data: StorageIcon,
  log: DescriptionIcon,
  config: DataObjectIcon,
  table: TableChartIcon,
  text: ArticleIcon,
  document: InsertDriveFileIcon,
  archive: FolderZipIcon,
  image: ImageIcon
}

/**
 * A drive entry's icon, or the empty column that keeps names aligned.
 *
 * Rendered on every row, folders and unknown types included: the tree gives a
 * folder an expand chevron rather than an icon slot, so a row with no icon of
 * its own still needs the column or its name starts at the label edge while
 * its siblings start one column in.
 */
const FileTypeIcon = ({
  filePath,
  isFolder
}: {
  filePath: string
  isFolder: boolean
}) => {
  // a folder is a folder whatever it is called, so one named `archive.sas`
  // does not get a program's mark
  const kind = isFolder ? null : driveFileKindOf(filePath)

  if (kind === 'program') return <SasjsMark />

  const Icon = kind === null ? null : ICONS[kind]

  if (!Icon) return <Box sx={{ width: FILE_ICON_SIZE, flex: '0 0 auto' }} />

  return (
    <Icon
      aria-hidden="true"
      sx={{
        fontSize: FILE_ICON_SIZE,
        color: 'text.secondary',
        flex: '0 0 auto'
      }}
    />
  )
}

export default FileTypeIcon
