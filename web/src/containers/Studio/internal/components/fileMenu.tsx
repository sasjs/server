import React from 'react'

import { Badge, IconButton, Tooltip } from '@mui/material'

import {
  AutoFixHigh,
  Difference,
  FormatAlignLeft,
  Save,
  SaveAs
} from '@mui/icons-material'

type FileMenuProps = {
  isDirty: boolean
  selectedFilePath: string
  setOpenFilePathInputModal: React.Dispatch<React.SetStateAction<boolean>>
  saveFile: () => void
  showChanges: () => void
  /**
   * Applies the fixes the `.sasjslint` rules can make on their own: trailing
   * spaces, tabs, line endings, the header's macro list, a line wrapped past
   * the limit. A rule that needs a decision - an unused macro variable, an
   * undeclared macro - is reported and left for the author.
   */
  fixLintIssues: () => void
  /**
   * Rewrites the layout as well: statement breaks, indentation and the
   * boundaries between macro calls.
   *
   * A second button rather than one that does both, because the two jobs are
   * asked for separately. An author who wants their spacing tidied does not
   * necessarily want their program re-laid-out.
   */
  formatDocument: () => void
  /** Why the lint-fix button is disabled, or undefined when it is not. */
  lintFixDisabledReason?: string
  /** Why the format button is disabled, or undefined when it is not. */
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

/**
 * A rewrite button, with the two things a disabled one owes the reader: why it
 * is disabled, and the same answer to a screen reader.
 *
 * The button sits inside a span so the tooltip survives being disabled - a
 * disabled button swallows the pointer events its tooltip needs.
 */
const RewriteButton = ({
  onClick,
  disabledReason,
  enabledLabel,
  label,
  children
}: {
  onClick: () => void
  disabledReason?: string
  /** Tooltip and aria-label while the button is usable. */
  enabledLabel: string
  /** Accessible name; the icon has no text of its own. */
  label: string
  children: React.ReactNode
}) => (
  <Tooltip title={disabledReason ?? enabledLabel}>
    <span>
      <IconButton
        aria-label={disabledReason ?? `${label}: ${enabledLabel}`}
        onClick={onClick}
        disabled={!!disabledReason}
      >
        {children}
      </IconButton>
    </span>
  </Tooltip>
)

const FileMenu = ({
  isDirty,
  selectedFilePath,
  setOpenFilePathInputModal,
  saveFile,
  showChanges,
  fixLintIssues,
  formatDocument,
  lintFixDisabledReason,
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
      <Tooltip title="Changes since last loaded or saved">
        <IconButton aria-label="Changes" onClick={showChanges}>
          <Difference />
        </IconButton>
      </Tooltip>
      <RewriteButton
        onClick={fixLintIssues}
        disabledReason={lintFixDisabledReason}
        enabledLabel="Fix what the .sasjslint rules can correct (spacing, tabs, line endings, the header)"
        label="Fix lint issues"
      >
        <AutoFixHigh />
      </RewriteButton>
      <RewriteButton
        onClick={formatDocument}
        disabledReason={formatDisabledReason}
        enabledLabel="Format the layout (indentation, statement breaks, macro calls)"
        label="Format"
      >
        <FormatAlignLeft />
      </RewriteButton>
    </>
  )
}

export default FileMenu
