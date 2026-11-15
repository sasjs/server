import { useState } from 'react'
import { Box, Typography } from '@mui/material'

import { JsonNode, jsonTreeOf } from '../render/jsonTree'

/**
 * A JSON document as collapsible branches.
 *
 * Shared by the two places a JSON document is read: a `.json` file on the drive,
 * and the `_webout` a program writes. Both want the same thing - the shape, with
 * one level open - so it lives here rather than in either pane.
 *
 * The open-branch set is state of the view rather than of the document, and the
 * caller keys the component on what it is showing, so a second document does not
 * arrive with the first one's branches already collapsed.
 */
export const JsonTreePane = ({ text }: { text: string }) => {
  const { root, error } = jsonTreeOf(text)

  // The root is open when there is one, and the first level with it: a reader who
  // opens a JSON document wants to see its keys, not a single closed row.
  const [open, setOpen] = useState<Set<string>>(
    () =>
      new Set(
        root
          ? [
              root.path,
              ...root.children
                .filter((child) => child.kind !== 'value')
                .map((child) => child.path)
            ]
          : []
      )
  )

  if (error)
    return (
      <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
        {`This is not valid JSON: ${error}`}
      </Typography>
    )

  if (!root)
    return (
      <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
        This document is empty.
      </Typography>
    )

  return (
    <Box sx={{ p: 1, overflow: 'auto' }}>
      <JsonTreeRow
        node={root}
        depth={0}
        open={open}
        onToggle={(path) =>
          setOpen((current) => {
            const next = new Set(current)
            if (next.has(path)) next.delete(path)
            else next.add(path)

            return next
          })
        }
      />
    </Box>
  )
}

/** One row of the tree: a caret for a container, the key, and its value. */
const JsonTreeRow = ({
  node,
  depth,
  open,
  onToggle
}: {
  node: JsonNode
  depth: number
  open: Set<string>
  onToggle: (path: string) => void
}) => {
  const isOpen = open.has(node.path)
  const isContainer = node.kind !== 'value'

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 0.5,
          pl: 1 + depth * 1.5,
          cursor: isContainer ? 'pointer' : 'default',
          '&:hover': { bgcolor: isContainer ? 'action.hover' : 'transparent' },
          fontFamily: 'monospace',
          fontSize: '0.85rem',
          whiteSpace: 'nowrap'
        }}
        onClick={() => isContainer && onToggle(node.path)}
        role={isContainer ? 'treeitem' : undefined}
        aria-expanded={isContainer ? isOpen : undefined}
      >
        <Box sx={{ width: '1ch', color: 'text.secondary' }}>
          {isContainer ? (isOpen ? '▾' : '▸') : ''}
        </Box>
        <Box component="span" sx={{ color: 'text.primary' }}>
          {node.label}
        </Box>
        {isContainer ? (
          <Box component="span" sx={{ color: 'text.secondary' }}>
            {node.kind === 'array' ? '[' : '{'} {node.summary}{' '}
            {node.kind === 'array' ? ']' : '}'}
          </Box>
        ) : (
          <Box component="span" sx={{ color: 'secondary.main' }}>
            {node.value}
          </Box>
        )}
      </Box>
      {isContainer &&
        isOpen &&
        node.children.map((child) => (
          <JsonTreeRow
            key={child.path}
            node={child}
            depth={depth + 1}
            open={open}
            onToggle={onToggle}
          />
        ))}
    </>
  )
}
