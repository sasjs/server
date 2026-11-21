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

/** A folder read once, and the query answered from it however many times. */
interface Reading {
  folder: string
  files: string[]
  contents: FileText[]
  scan: Scan
}

/**
 * What a folder search left out, in one line, or '' when it covered everything.
 *
 * A cap that is not reported is a search that claims to have read a folder it only
 * part-read, and the reader's conclusion - "the word is not in there" - would be
 * wrong. So the caps are said out loud, beneath the results they limit.
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
 * and choosing a result opens the file in the editor.
 *
 * The read is expensive - one request per folder, one per text file - so it happens
 * once per folder and every later query is answered from what it read. Nothing is
 * read until there is something to look for, and the caps on that read are reported
 * beneath the results.
 */
const FolderSearch = ({ folder, name, autoFocus, onOpenFile }: Props) => {
  const [query, setQuery] = useState('')
  const [reading, setReading] = useState<{
    done: number
    total: number
  } | null>(null)
  // The scan's answer, and which folder it is an answer for. Kept as one value so
  // a result that arrives for a folder the reader has left cannot be shown as this
  // one's.
  const [found, setFound] = useState<Reading | null>(null)
  const [failed, setFailed] = useState(false)
  const scans = useRef<{
    folder: string
    promise: Promise<Reading | null>
  } | null>(null)
  // Whether this component is still the one on screen. A walk cannot be cancelled,
  // so every result is checked against this and against the folder it was for.
  const live = useRef(true)
  // The folder on screen, readable from a callback that started on another one. A
  // scan cannot be cancelled, so this is what a late answer is compared against.
  const showing = useRef(folder)
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

  // A different folder is a different search: the field empties, and the previous
  // folder's findings go with it.
  useEffect(() => {
    showing.current = folder
    setQuery('')
    setReading(null)
    setFound(null)
    setFailed(false)
    scans.current = null
  }, [folder])

  const needle = query.trim()
  const asked = needle.length >= 2
  const answered = found?.folder === folder

  useEffect(() => {
    if (!asked) return

    const startedFor = folder
    const mine = () => live.current && showing.current === startedFor

    let scan = scans.current

    if (!scan || scan.folder !== startedFor) {
      const promise = walkDrivePaths(
        (path) => listFolder(path),
        WALK_CONCURRENCY,
        startedFor
      )
        .then((files) =>
          readContents(files, readFileText, (done, total) => {
            if (mine()) setReading({ done, total })
          }).then((result) => ({
            folder: startedFor,
            files,
            contents: result.contents,
            scan: result
          }))
        )
        // a walk that threw is not an answer: the folder could not be read, which
        // is not the same as a folder that does not contain the word
        .catch(() => null)

      scan = { folder: startedFor, promise }
      scans.current = scan
      setReading({ done: 0, total: 0 })
      setFound(null)
      setFailed(false)
    }

    // The resolve is attached every time, not only when the scan starts: a cached
    // scan is a promise that has already settled, and a reader who typed, cleared
    // and typed again needs its answer put back on screen.
    scan.promise
      .then((result) => {
        if (!mine()) return

        setReading(null)

        if (!result) {
          setFailed(true)
          // not kept, so the next query tries the folder again
          if (scans.current?.folder === startedFor) scans.current = null

          return
        }

        setFound(result)
      })
      .catch(() => undefined)
  }, [asked, folder])

  // A reading belongs to the folder it was made for: without this, a scan started
  // on one folder that settles after the reader has opened another would list the
  // first folder's matches under the second one's heading.
  const hits: Hit[] = useMemo(
    () =>
      matches('folder', query, {
        docs: [],
        operations: [],
        apps: [],
        files: answered ? (found?.files ?? []) : [],
        contents: answered ? (found?.contents ?? []) : []
      }),
    [query, found, answered]
  )

  const note = scanNote(answered ? (found?.scan ?? null) : null)
  const busy = reading
    ? reading.total
      ? `Reading ${reading.done} of ${reading.total} files…`
      : 'Reading this folder…'
    : ''

  const nothing = () => {
    if (!asked) {
      return `Searches this folder's files by name, and the text inside them.`
    }
    if (busy) return busy
    if (failed) return 'This folder could not be read.'
    if (!answered) return 'Reading this folder…'

    return `Nothing in this folder matches “${needle}”.`
  }

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

      {hits.length ? (
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
          {nothing()}
          {answered && note ? ` ${note}` : ''}
        </Typography>
      )}
    </Box>
  )
}

export default FolderSearch
