import React from 'react'

import { Badge, IconButton, Tooltip } from '@mui/material'

import { AutoFixHigh, Save, SaveAs } from '@mui/icons-material'

type FileMenuProps = {
  isDirty: boolean
  selectedFilePath: string
  setOpenFilePathInputModal: React.Dispatch<React.SetStateAction<boolean>>
  saveFile: () => void
  /**
   * Applies the `.sasjslint` formatting rules to the buffer.
   *
   * Formatting, not "fix the issues": the rules that can be corrected without
   * judgement are layout, spacing and case. A rule about an unused macro
   * variable needs a decision no button can make.
   */
  fixFormatting: () => void
  /** Why the button is disabled, or undefined when it is not. */
  formatDisabledReason?: string
}

/**
 * The editor's save control.
 *
 * The disk is always there, so saving is one click rather than a menu away, and
 * the dot on it is the state of the buffer: present while the file holds edits
 * that are not on the drive yet, gone once they are. The dot is blue rather
 * than the theme's primary, which is black, and it carries the same news to a
 * screen reader through the button's label.
 *
 * The disk is disabled when a file matches what the drive holds, because a
 * click on it would write nothing and say nothing. A buffer with no file behind
 * it stays enabled: saving one asks for a path.
 */
const SaveButton = ({
  isDirty,
  selectedFilePath,
  saveFile
}: Pick<FileMenuProps, 'isDirty' | 'selectedFilePath' | 'saveFile'>) => {
  const canSave = !selectedFilePath || isDirty
  const label = !canSave
    ? 'Nothing to save'
    : isDirty
      ? 'Save (unsaved changes)'
      : 'Save'

  return (
    <Tooltip title={label}>
      {/* A disabled button swallows the pointer events its tooltip needs. */}
      <span>
        <Badge
          color="info"
          variant="dot"
          invisible={!isDirty}
          overlap="circular"
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <IconButton aria-label={label} onClick={saveFile} disabled={!canSave}>
            <Save />
          </IconButton>
        </Badge>
      </span>
    </Tooltip>
  )
}

const FileMenu = ({
  isDirty,
  selectedFilePath,
  setOpenFilePathInputModal,
  saveFile,
  fixFormatting,
  formatDisabledReason
}: FileMenuProps) => {
  return (
    <>
      <SaveButton
        isDirty={isDirty}
        selectedFilePath={selectedFilePath}
        saveFile={saveFile}
      />
      <Tooltip title="Save as a new file">
        <span>
          <IconButton
            aria-label="Save as a new file"
            onClick={() => setOpenFilePathInputModal(true)}
            disabled={!selectedFilePath}
          >
            <SaveAs />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip
        title={formatDisabledReason ?? 'Apply the .sasjslint formatting rules'}
      >
        <span>
          <IconButton
            aria-label={formatDisabledReason ?? 'Apply the formatting rules'}
            onClick={fixFormatting}
            disabled={!!formatDisabledReason}
          >
            <AutoFixHigh />
          </IconButton>
        </span>
      </Tooltip>
    </>
  )
}

export default FileMenu
