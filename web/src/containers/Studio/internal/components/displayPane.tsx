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

import { JsonTreePane } from './jsonTreePane'
import { displayKindOf } from '../displayMode'
import { CsvTable, csvTable } from '../render/csv'
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
  if (kind === 'json') return <JsonTreePane key={filePath} text={text} />

  return placeholder('This file has no rendered view.')
}
