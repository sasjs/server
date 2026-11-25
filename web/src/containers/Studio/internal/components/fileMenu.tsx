import React from 'react'

import { Badge, CircularProgress, IconButton, Tooltip } from '@mui/material'

import {
  AutoFixHigh,
  Difference,
  FormatAlignLeft,
  Save,
  SaveAs
} from '@mui/icons-material'

type FileMenuProps = {
  isDirty: boolean
  /** Whether a save is in flight, so the disk can say so and refuse a second one. */
  saving: boolean
  selectedFilePath: string
  setOpenFilePathInputModal: React.Dispatch<React.SetStateAction<boolean>>
  saveFile: () => void
  showChanges: () => void
  /** Why the Changes button is disabled, or undefined when it is not. */
  changesDisabledReason?: string
  /**
   * Runs the fixes pass without the layout engine: trailing spaces, line
   * endings, the Doxygen header, the wrapping a line over the length limit gets,
   * and the macro declarations a header lists but the file never invokes - those
   * are removed. A finding the pass leaves alone, such as a tab used for
   * indentation or a line the formatter cannot break, is reported and left for
   * the author.
   */
  fixLintIssues: () => void
  /**
   * Lays the program out first - statement breaks, indentation and the
   * boundaries between macro calls - and then applies the same rule fixes over
   * the layout.
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
 * it stays enabled: saving one asks for a path. While a save runs the disk
 * spins and refuses a second click - the formatter is a server round trip, and
 * a pause with no state of its own reads as a missed keypress.
 */
const SaveButton = ({
  isDirty,
  saving,
  selectedFilePath,
  saveFile
}: Pick<
  FileMenuProps,
  'isDirty' | 'saving' | 'selectedFilePath' | 'saveFile'
>) => {
  const canSave = (!selectedFilePath || isDirty) && !saving
  const label = saving
    ? 'Saving...'
    : !selectedFilePath || isDirty
      ? 'Save (unsaved changes)'
      : 'Nothing to save'

  return (
    <Tooltip title={label}>
      {/* A disabled button swallows the pointer events its tooltip needs. */}
      <span>
        <Badge
          color="info"
          variant="dot"
          invisible={!isDirty || saving}
          overlap="circular"
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <IconButton aria-label={label} onClick={saveFile} disabled={!canSave}>
            {saving ? <CircularProgress size={20} color="inherit" /> : <Save />}
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
  saving,
  selectedFilePath,
  setOpenFilePathInputModal,
  saveFile,
  showChanges,
  changesDisabledReason,
  fixLintIssues,
  formatDocument,
  lintFixDisabledReason,
  formatDisabledReason
}: FileMenuProps) => {
  return (
    <>
      <SaveButton
        isDirty={isDirty}
        saving={saving}
        selectedFilePath={selectedFilePath}
        saveFile={saveFile}
      />
      <Tooltip title="Save as a new file">
        <span>
          <IconButton
            aria-label="Save as a new file"
            onClick={() => setOpenFilePathInputModal(true)}
            disabled={!selectedFilePath || saving}
          >
            <SaveAs />
          </IconButton>
        </span>
      </Tooltip>
      <RewriteButton
        onClick={showChanges}
        disabledReason={changesDisabledReason}
        enabledLabel="Show changes since last loaded or saved (Ctrl+Shift+D)"
        label="Changes"
      >
        <Difference />
      </RewriteButton>
      <RewriteButton
        onClick={fixLintIssues}
        disabledReason={lintFixDisabledReason}
        enabledLabel="Fix what the .sasjslint rules can correct (spacing, line endings, the header)"
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
