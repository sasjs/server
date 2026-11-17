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
import { useCallback, useEffect, useMemo, useRef } from 'react'

import { Box, Typography } from '@mui/material'

import { JsonTreePane } from './jsonTreePane'
import { displayKindOf } from '../displayMode'
import { CsvTable, csvTable } from '../render/csv'
import { fragmentOf, markdownToHtml } from '../render/markdown'

const placeholder = (text: string) => (
  <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
    {text}
  </Typography>
)

/**
 * A Markdown document, and the links inside it.
 *
 * The pane is the scroll container - the page around it does not scroll - so a
 * `#section` link has to move the pane itself: the browser's own fragment jump
 * looks for a scrolling box that is not this one, and when the document arrives
 * after the load there is nothing to jump to anyway.
 */
const MarkdownPane = ({
  filePath,
  text
}: {
  filePath: string
  text: string
}) => {
  const pane = useRef<HTMLDivElement>(null)
  const html = useMemo(() => markdownToHtml(text), [text])
  /** The document-and-fragment already honoured, so a re-render keeps its place. */
  const honoured = useRef('')

  const scrollToAnchor = useCallback((id: string) => {
    const target = pane.current?.querySelector(
      `[id="${id.replace(/["\\]/g, '\\$&')}"]`
    ) as HTMLElement | null

    if (target) target.scrollIntoView({ block: 'start' })
  }, [])

  /**
   * Lands on a section and records that this document has been taken there.
   *
   * The record is what stops the effect below from pulling a reader back: once a
   * link has been followed, the hash stays in the URL, and without it every
   * re-render - a keystroke, a save, an external edit - would scroll the pane to
   * that section again.
   */
  const followHash = useCallback(
    (id: string) => {
      honoured.current = `${filePath}#${id}`
      scrollToAnchor(id)
    },
    [filePath, scrollToAnchor]
  )

  // A URL that names a section opens on it: `?filePath=...SPFinit.md#helpinfo` is
  // the link people share, and it has to land where it says. The document is not
  // here when the page loads, so this runs again as the text arrives - once per
  // document, which is what `honoured` counts.
  useEffect(() => {
    const id = fragmentOf(window.location.hash)

    if (!id || honoured.current === `${filePath}#${id}`) return

    followHash(id)
  }, [html, filePath, followHash])

  return (
    <Box
      ref={pane}
      onClick={(event) => {
        const link = (event.target as HTMLElement).closest(
          'a[data-anchor]'
        ) as HTMLAnchorElement | null

        if (!link) return

        // In this pane, not a new tab: the anchor is a place in the document the
        // reader is already looking at.
        event.preventDefault()
        const id = fragmentOf(link.hash)

        if (!id) return

        followHash(id)
        window.history.replaceState(null, '', link.hash)
      }}
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
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

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

  if (kind === 'markdown')
    return <MarkdownPane filePath={filePath} text={text} />
  if (kind === 'csv') return <CsvPane text={text} />
  // Keyed on the file: the open-branch set is state of the view, and carrying it
  // across a switch would show the next document with the last one's branches
  // already collapsed.
  if (kind === 'json') return <JsonTreePane key={filePath} text={text} />

  return placeholder('This file has no rendered view.')
}
