import { useEffect, useMemo, useRef, useState } from 'react'

import {
  Box,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  Typography
} from '@mui/material'

import {
  MAX_CONTENT_BYTES,
  MAX_CONTENT_FILES,
  MAX_SCAN_TEXT,
  readContents
} from '../utils/contentSearch'
import type { Scan } from '../utils/contentSearch'
import { listFolder, readFileText } from '../utils/driveRequests'
import { WALK_CONCURRENCY, walkDrivePaths } from '../utils/driveWalk'
import type { FileText, Hit } from '../utils/search'
import { kindLabel, matches } from '../utils/search'

interface Props {
  /** The folder being searched, drive-relative: '' is the drive root. */
  folder: string
  /** The folder's own name, for the field's label and placeholder. */
  name: string
  /** Puts the cursor in the field when the page was opened to search it. */
  autoFocus?: boolean
  /** Opens a file the reader chose. */
  onOpenFile: (filePath: string) => void
}

/**
 * What a folder search left out, in one line, or '' when it covered everything.
 *
 * A cap that is not reported is a search that claims to have read a folder it only
 * part-read, and the reader's conclusion - "the word is not in there" - would be
 * wrong. So the caps are said out loud, under the results they limit.
 */
const scanNote = (scan: Scan | null): string => {
  if (!scan) return ''

  const parts: string[] = []

  if (scan.skipped)
    parts.push(
      scan.stopped === 'text'
        ? `read ${scan.readable - scan.skipped} of ${
            scan.readable
          } text files, to ${Math.round(MAX_SCAN_TEXT / (1024 * 1024))} MB`
        : `read the first ${MAX_CONTENT_FILES} of ${scan.readable} text files`
    )
  if (scan.clipped)
    parts.push(
      `searched ${scan.clipped} long file${
        scan.clipped === 1 ? '' : 's'
      } to ${Math.round(MAX_CONTENT_BYTES / 1024)} KB`
    )
  if (scan.unreadable) parts.push(`${scan.unreadable} could not be read`)

  if (!parts.length) return ''

  const sentence = parts.join('; ')

  return `${sentence[0].toUpperCase()}${sentence.slice(1)}.`
}

/**
 * The search box a folder page carries.
 *
 * The header's box answers "where is the file I want" for the whole screen; this
 * one answers "where in THIS folder is the thing I mean", and it is here rather
 * than in the header because that is where the reader is looking when they open a
 * folder. It searches the names of the folder's files and the text inside them,
 * and choosing a result opens the file at the line it was found on.
 *
 * The scan is expensive - one request per folder, one per text file - so it runs
 * once per folder and the later queries are answered from what it read. The caps
 * on that read are reported underneath, and nothing is read until there is
 * something to look for.
 */
const FolderSearch = ({ folder, name, autoFocus, onOpenFile }: Props) => {
  const [query, setQuery] = useState('')
  const [files, setFiles] = useState<string[]>([])
  const [contents, setContents] = useState<FileText[]>([])
  const [scan, setScan] = useState<Scan | null>(null)
  const [reading, setReading] = useState<{
    done: number
    total: number
  } | null>(null)
  const [searched, setSearched] = useState(false)
  // The scan for the folder on screen, so a second query is not a second read.
  // Reset when the folder changes, and dropped on unmount with the component.
  const scanned = useRef<{ folder: string; promise: Promise<void> } | null>(
    null
  )
  const live = useRef(true)
  const fieldRef = useRef<HTMLInputElement>(null)

  // Focus after mount rather than through `autoFocus` alone: the page renders this
  // box while the editor is still settling, and anything that takes focus on the
  // way - a tab switch, the editor's own mount - would beat a one-shot attribute.
  useEffect(() => {
    if (autoFocus) fieldRef.current?.focus()
  }, [autoFocus, folder])

  useEffect(() => {
    live.current = true

    return () => {
      live.current = false
    }
  }, [])

  // A different folder is a different search: the field empties and the previous
  // folder's findings go with it.
  useEffect(() => {
    setQuery('')
    setFiles([])
    setContents([])
    setScan(null)
    setReading(null)
    setSearched(false)
    scanned.current = null
  }, [folder])

  const needle = query.trim()
  const asked = needle.length >= 2

  useEffect(() => {
    if (!asked) return

    if (!scanned.current || scanned.current.folder !== folder) {
      const promise = walkDrivePaths(
        (path) => listFolder(path),
        WALK_CONCURRENCY,
        folder
      )
        .then((found) =>
          readContents(found, readFileText, (done, total) => {
            if (live.current) setReading({ done, total })
          }).then((result) => {
            if (!live.current) return

            setFiles(found)
            setContents(result.contents)
            setScan(result)
            setSearched(true)
            setReading(null)
          })
        )
        .catch(() => {
          if (!live.current) return

          setSearched(true)
          setReading(null)
        })

      scanned.current = { folder, promise }
    }

    setReading({ done: 0, total: 0 })
    setSearched(false)

    scanned.current.promise.catch(() => undefined)
  }, [asked, folder])

  const hits: Hit[] = useMemo(
    () =>
      matches('folder', query, {
        docs: [],
        operations: [],
        apps: [],
        files,
        contents
      }),
    [query, files, contents]
  )

  const note = scanNote(scan)
  const busy = reading
    ? reading.total
      ? `Reading ${reading.done} of ${reading.total} files…`
      : 'Reading this folder…'
    : ''
  const settled = searched && !reading

  return (
    <Box sx={{ mb: 2 }}>
      <TextField
        size="small"
        inputRef={fieldRef}
        value={query}
        autoFocus={autoFocus}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={`Search in ${name}`}
        sx={{ width: 320 }}
        slotProps={{
          htmlInput: { 'aria-label': `Search the files in ${name}` }
        }}
      />

      {!asked ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Searches this folder&apos;s files by name, and the text inside them.
        </Typography>
      ) : busy ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {busy}
        </Typography>
      ) : hits.length ? (
        <>
          <List dense sx={{ py: 0, maxWidth: 720 }}>
            {hits.map((hit) => (
              <ListItemButton
                key={`${hit.kind}:${hit.title}:${hit.detail}`}
                onClick={() => hit.filePath && onOpenFile(hit.filePath)}
              >
                <ListItemText
                  primary={hit.title}
                  secondary={hit.detail}
                  slotProps={{
                    primary: { variant: 'body2' },
                    secondary: { variant: 'caption' }
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  {kindLabel(hit.kind)}
                </Typography>
              </ListItemButton>
            ))}
          </List>
          {note ? (
            <Typography variant="caption" color="text.secondary">
              {note}
            </Typography>
          ) : null}
        </>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {settled
            ? `Nothing in this folder matches “${needle}”.`
            : 'Searching…'}
          {note ? ` ${note}` : ''}
        </Typography>
      )}
    </Box>
  )
}

export default FolderSearch
