import React, { useState } from 'react'

import {
  Badge,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Tooltip
} from '@mui/material'

import { MoreVert, Save, SaveAs, Difference, Edit } from '@mui/icons-material'

type FileMenuProps = {
  showDiff: boolean
  setShowDiff: React.Dispatch<React.SetStateAction<boolean>>
  isDirty: boolean
  setOpenFilePathInputModal: React.Dispatch<React.SetStateAction<boolean>>
  saveFile: () => void
}

/**
 * The editor's save control.
 *
 * The disk is always there, so saving is one click rather than a menu away, and
 * the dot on it is the state of the buffer: present while the file holds edits
 * that are not on the drive yet, gone once they are. The dot is blue rather
 * than the theme's primary, which is black, and it carries the same news to a
 * screen reader through the button's label.
 */
const SaveButton = ({
  isDirty,
  saveFile
}: Pick<FileMenuProps, 'isDirty' | 'saveFile'>) => {
  const label = isDirty ? 'Save (unsaved changes)' : 'Save'

  return (
    <Tooltip title={label}>
      <Badge
        color="info"
        variant="dot"
        invisible={!isDirty}
        overlap="circular"
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <IconButton aria-label={label} onClick={saveFile}>
          <Save />
        </IconButton>
      </Badge>
    </Tooltip>
  )
}

const FileMenu = ({
  showDiff,
  setShowDiff,
  isDirty,
  setOpenFilePathInputModal,
  saveFile
}: FileMenuProps) => {
  const [anchorEl, setAnchorEl] = useState<
    (EventTarget & HTMLButtonElement) | null
  >(null)

  const handleMenu = (
    event?: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    if (event) setAnchorEl(event.currentTarget)
    else setAnchorEl(null)
  }

  const handleDiffBtnClick = () => {
    setAnchorEl(null)
    setShowDiff(!showDiff)
  }

  const handleSaveAsBtnClick = () => {
    setAnchorEl(null)
    setOpenFilePathInputModal(true)
  }

  return (
    <>
      <SaveButton isDirty={isDirty} saveFile={saveFile} />
      <Tooltip title="Save File Menu">
        <IconButton onClick={handleMenu}>
          <MoreVert />
        </IconButton>
      </Tooltip>
      <Menu
        id="save-file-menu"
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center'
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center'
        }}
        open={!!anchorEl}
        onClose={() => handleMenu()}
      >
        <MenuItem sx={{ justifyContent: 'center' }}>
          <Button
            onClick={handleDiffBtnClick}
            variant="contained"
            color="primary"
            startIcon={showDiff ? <Edit /> : <Difference />}
          >
            {showDiff ? 'Edit' : 'Diff'}
          </Button>
        </MenuItem>
        <MenuItem sx={{ justifyContent: 'center' }}>
          <Button
            onClick={handleSaveAsBtnClick}
            variant="contained"
            color="primary"
            startIcon={<SaveAs />}
          >
            Save As
          </Button>
        </MenuItem>
      </Menu>
    </>
  )
}

export default FileMenu
