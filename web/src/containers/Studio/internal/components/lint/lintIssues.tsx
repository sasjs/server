import { useState } from 'react'
import {
  Box,
  Chip,
  Collapse,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Typography
} from '@mui/material'
import { ExpandLess, ExpandMore } from '@mui/icons-material'
import type * as monaco from 'monaco-editor'

import {
  LintSummary,
  SEVERITY_ERROR,
  SEVERITY_HINT,
  SEVERITY_INFO,
  SEVERITY_WARNING,
  describeLintSummary,
  summariseLintIssues
} from '../../lintIssues'

interface Props {
  markers: monaco.editor.IMarkerData[]
  /** Moves the editor to a finding's line. */
  onSelectLine: (lineNumber: number) => void
}

/** The severity colours, the same four the marker underlines use. */
const severityColour = (severity: number) => {
  if (severity === SEVERITY_ERROR) return 'error.main'
  if (severity === SEVERITY_WARNING) return 'warning.main'
  if (severity === SEVERITY_INFO) return 'info.main'

  return 'text.secondary'
}

const severityLabel = (severity: number) => {
  if (severity === SEVERITY_ERROR) return 'Error'
  if (severity === SEVERITY_WARNING) return 'Warning'
  if (severity === SEVERITY_INFO) return 'Info'
  if (severity === SEVERITY_HINT) return 'Hint'

  return 'Issue'
}

/**
 * The lint findings for the open buffer, above the editor.
 *
 * The same shape as the log's issue summary, deliberately: a one-line count that
 * expands into the findings, each of which jumps to its line. It sits above the
 * editor rather than in a tab of its own because a finding describes the code
 * being read - leaving the code to read it is the wrong way round - and rather
 * than in a bottom pane because that costs the editor the height the log and
 * the output need.
 *
 * Nothing is rendered when the buffer is clean: an empty panel is a row of
 * chrome that says "all well" every time you look at it.
 */
const LintIssues = ({ markers, onSelectLine }: Props) => {
  const summary: LintSummary = summariseLintIssues(markers)
  const [open, setOpen] = useState(true)

  if (!summary.issues.length) return null

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        bgcolor: 'background.paper',
        mb: 1
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 1,
          py: 0.5
        }}
      >
        <IconButton
          size="small"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Collapse lint issues' : 'Expand lint issues'}
        >
          {open ? (
            <ExpandLess fontSize="small" />
          ) : (
            <ExpandMore fontSize="small" />
          )}
        </IconButton>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {describeLintSummary(summary)}
        </Typography>
        {summary.errors > 0 && (
          <Chip size="small" color="error" label={`${summary.errors} error`} />
        )}
        {summary.warnings > 0 && (
          <Chip
            size="small"
            color="warning"
            label={`${summary.warnings} warning`}
          />
        )}
      </Box>
      <Collapse in={open}>
        <Divider />
        <List dense sx={{ maxHeight: 200, overflow: 'auto', py: 0 }}>
          {summary.issues.map((issue, index) => (
            <ListItemButton
              key={`${issue.lineNumber}-${index}`}
              onClick={() => onSelectLine(issue.lineNumber)}
            >
              <ListItemText
                primary={issue.message}
                secondary={`line ${issue.lineNumber} - ${severityLabel(
                  issue.severity
                )}`}
                slotProps={{
                  primary: { variant: 'body2' },
                  secondary: {
                    variant: 'caption',
                    sx: { color: severityColour(issue.severity) }
                  }
                }}
              />
            </ListItemButton>
          ))}
        </List>
      </Collapse>
    </Box>
  )
}

export default LintIssues
