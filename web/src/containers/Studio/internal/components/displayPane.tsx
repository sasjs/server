/**
 * What a file looks like rendered, for the display modes that render.
 *
 * Three documents, three views, one component: a Markdown page, a CSV table and a
 * JSON tree. Each is fed the editor's current text rather than the file on the
 * drive, so the pane shows what is being typed; the source is one toggle away and
 * nothing here writes.
 *
 * The tree is the only stateful one - which branches are open - and its state
 * lives here rather than in the editor because it is a property of the view, not
 * of the file.
 */
import { useMemo, useState } from 'react'

import { Box, Typography } from '@mui/material'

import { displayKindOf } from '../displayMode'
import { CsvTable, csvTable } from '../render/csv'
import { JsonNode, jsonTreeOf } from '../render/jsonTree'
import { markdownToHtml } from '../render/markdown'

const placeholder = (text: string) => (
  <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
    {text}
  </Typography>
)

/** A Markdown document, rendered from the buffer's text. */
const MarkdownPane = ({ text }: { text: string }) => (
  <Box
    sx={{
      p: 2,
      overflow: 'auto',
      typography: 'body1',
      '& h1, & h2, & h3, & h4, & h5, & h6': { mt: 2, mb: 1 },
      '& pre': {
        p: 1,
        overflow: 'auto',
        bgcolor: 'action.hover',
        borderRadius: 1
      },
      '& code': { fontFamily: 'monospace' },
      '& blockquote': {
        m: 0,
        pl: 2,
        borderLeft: 3,
        borderColor: 'divider',
        color: 'text.secondary'
      },
      '& a': { color: 'primary.main' }
    }}
    // The renderer escapes the text it is given and writes the only tags in the
    // output, so what arrives here is markup this app produced.
    dangerouslySetInnerHTML={{ __html: markdownToHtml(text) }}
  />
)

/** A CSV document as a table, with the header row the file declares. */
const CsvPane = ({ text }: { text: string }) => {
  // Parsed once per buffer text rather than once per render: the pane redraws on
  // every keystroke.
  const table: CsvTable = useMemo(() => csvTable(text), [text])

  if (!table.columns) return placeholder('This file has no rows to show.')

  return (
    <Box sx={{ p: 2, overflow: 'auto' }}>
      <Box component="table" sx={{ borderCollapse: 'collapse', width: '100%' }}>
        <Box component="thead">
          <Box component="tr">
            {table.header.map((name, index) => (
              <Box
                component="th"
                key={index}
                sx={{
                  textAlign: 'left',
                  p: 0.75,
                  borderBottom: 1,
                  borderColor: 'divider',
                  position: 'sticky',
                  top: 0,
                  bgcolor: 'background.paper',
                  whiteSpace: 'nowrap'
                }}
              >
                {name}
              </Box>
            ))}
          </Box>
        </Box>
        <Box component="tbody">
          {table.rows.map((row, rowIndex) => (
            <Box component="tr" key={rowIndex}>
              {Array.from({ length: table.columns }, (_, columnIndex) => (
                <Box
                  component="td"
                  key={columnIndex}
                  sx={{
                    p: 0.75,
                    borderBottom: 1,
                    borderColor: 'divider',
                    fontFamily: 'monospace',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {row[columnIndex] ?? ''}
                </Box>
              ))}
            </Box>
          ))}
        </Box>
      </Box>
      <Typography variant="caption" color="text.secondary">
        {table.truncated
          ? `First ${table.rows.length} rows - the file is longer`
          : `${table.rows.length} ${table.rows.length === 1 ? 'row' : 'rows'}`}
      </Typography>
    </Box>
  )
}

/** One row of the JSON tree: a caret for a container, the key, and its value. */
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

/** A JSON document as collapsible branches. */
const JsonPane = ({ text }: { text: string }) => {
  const { root, error } = jsonTreeOf(text)

  // The root is open when there is one, and the first level with it: a reader who
  // opens a JSON file wants to see its keys, not a single closed row.
  const [open, setOpen] = useState<Set<string>>(
    () =>
      new Set(
        root
          ? [
              root.path,
              ...root.children
                .filter((c) => c.kind !== 'value')
                .map((c) => c.path)
            ]
          : []
      )
  )

  if (error) return placeholder(`This is not valid JSON: ${error}`)
  if (!root) return placeholder('This file is empty.')

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

/** The rendered view of a file, by what it is. */
export const DisplayPane = ({
  filePath,
  text
}: {
  filePath: string
  text: string
}) => {
  const kind = displayKindOf(filePath)

  if (kind === 'markdown') return <MarkdownPane text={text} />
  if (kind === 'csv') return <CsvPane text={text} />
  // Keyed on the file: the open-branch set is state of the view, and carrying it
  // across a switch would show the next document with the last one's branches
  // already collapsed.
  if (kind === 'json') return <JsonPane key={filePath} text={text} />

  return placeholder('This file has no rendered view.')
}
