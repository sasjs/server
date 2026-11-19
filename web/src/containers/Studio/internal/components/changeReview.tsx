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
import { createReview } from '../changes'

/** A read-only snapshot review. The live editor stays mounted behind this pane. */
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
  const revertLabel = untitled ? 'Revert to baseline' : 'Revert to saved'
  useEffect(() => {
    if (!node.current) return
    return createReview(monaco, node.current, before, after, language)
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
        {onUndoFormatting && (
          <Button onClick={onUndoFormatting}>Undo formatting</Button>
        )}
        {onRevert && (
          <Button onClick={() => onRevert.begin() && setConfirming(true)}>
            {revertLabel}
          </Button>
        )}
        <Button onClick={onClose}>Back to editor</Button>
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
