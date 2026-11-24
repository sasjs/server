import { useEffect, useRef, useState } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography
} from '@mui/material'
import { monaco } from 'react-monaco-editor'
import { createReview, LineChangeCount } from '../changes'

/** "12 added, 3 removed", or nothing while Monaco is still comparing. */
const describeChanges = (count: LineChangeCount | null): string => {
  if (!count) return ''
  if (!count.added && !count.removed) return 'No line differences'

  const added = `${count.added} added`
  const removed = `${count.removed} removed`

  return count.added && count.removed
    ? `${added}, ${removed}`
    : count.added
      ? added
      : removed
}

/**
 * A read-only snapshot review, shown beside the live editor rather than in
 * place of it.
 *
 * The editor stays mounted and editable behind this pane. A diff is something
 * the author asked to see - it must never be the thing that stops them
 * typing - so this pane shares the width instead of taking it.
 */
export const ChangeReview = ({
  before,
  after,
  language,
  label,
  onClose,
  onUndoFormatting,
  onRevert,
  untitled
}: {
  before: string
  after: string
  language: string
  label: string
  onClose: () => void
  onUndoFormatting?: () => void
  onRevert?: {
    begin: () => boolean
    cancel: () => void
    confirm: () => void
  }
  untitled: boolean
}) => {
  const node = useRef<HTMLDivElement>(null)
  const [confirming, setConfirming] = useState(false)
  const [count, setCount] = useState<LineChangeCount | null>(null)
  const revertLabel = untitled ? 'Revert to baseline' : 'Revert to saved'
  useEffect(() => {
    if (!node.current) return
    setCount(null)
    return createReview(monaco, node.current, before, after, language, setCount)
  }, [before, after, language])

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0
      }}
    >
      <Box
        sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}
      >
        <Typography variant="body2" sx={{ flexGrow: 1 }}>
          {label}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {describeChanges(count)}
        </Typography>
        {onUndoFormatting && (
          <Button onClick={onUndoFormatting}>Undo formatting</Button>
        )}
        {onRevert && (
          <Button onClick={() => onRevert.begin() && setConfirming(true)}>
            {revertLabel}
          </Button>
        )}
        <Button onClick={onClose}>Close diff</Button>
      </Box>
      <Dialog
        open={confirming}
        onClose={() => {
          onRevert?.cancel()
          setConfirming(false)
        }}
        aria-labelledby="revert-confirm-title"
      >
        <DialogTitle id="revert-confirm-title">{revertLabel}?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Replace the current buffer with the{' '}
            {untitled ? 'baseline' : 'last loaded or saved version'}? This does
            not write to disk and can be undone in the editor.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              onRevert?.cancel()
              setConfirming(false)
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              setConfirming(false)
              onRevert?.confirm()
            }}
          >
            {revertLabel}
          </Button>
        </DialogActions>
      </Dialog>
      <Box
        ref={node}
        aria-label="Changes comparison"
        sx={{ flex: 1, minHeight: 0 }}
      />
    </Box>
  )
}
