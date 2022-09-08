import React, { useState } from 'react'

import { Button, IconButton, Menu, MenuItem, Tooltip } from '@mui/material'

import { MoreVert, Save, SaveAs, Difference, Edit } from '@mui/icons-material'

type FileMenuProps = {
  showDiff: boolean
  setShowDiff: React.Dispatch<React.SetStateAction<boolean>>
  prevFileContent: string
  currentFileContent: string
  selectedFilePath: string
  setOpenFilePathInputModal: React.Dispatch<React.SetStateAction<boolean>>
  saveFile: () => void
}

const FileMenu = ({
  showDiff,
  setShowDiff,
  prevFileContent,
  currentFileContent,
  selectedFilePath,
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

  const handleSaveBtnClick = () => {
    setAnchorEl(null)
    saveFile()
  }

  return (
    <>
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
            onClick={handleSaveBtnClick}
            variant="contained"
            color="primary"
            startIcon={<Save />}
            disabled={
              !selectedFilePath || prevFileContent === currentFileContent
            }
          >
            Save
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
