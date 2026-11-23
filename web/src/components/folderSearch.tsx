import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEventHandler } from 'react'

import {
  Box,
  Button,
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
import {
  RESULTS_BATCH,
  isSearchQuery,
  kindLabel,
  matches
} from '../utils/search'

interface Props {
  /** The folder being searched, drive-relative: '' is the drive root. */
  folder: string
  /** The folder's own name, for the field's label and placeholder. */
  name: string
  /** The query, held by the page so it can tell whether a search is running. */
  query: string
  /** Called as the reader types. */
  onQueryChange: (value: string) => void
  /** Puts the cursor in the field when the page was opened to search it. */
  autoFocus?: boolean
  /** Opens a file the reader chose. */
  onOpenFile: (filePath: string) => void
  onOpenFolder: (folderPath: string) => void
}

/** A folder read once, and the query answered from it however many times. */
interface Reading {
  folder: string
  files: string[]
  folders: string[]
  unreadableFolders: number
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
 * folder. It searches descendant folder and file names and the text inside files;
 * choosing a result opens the corresponding folder or file.
 *
 * The read is expensive - one request per folder, one per text file - so it happens
 * once per folder and every later query is answered from what it read. Nothing is
 * read until there is something to look for, and the caps on that read are reported
 * beneath the results.
 */
const FolderSearch = ({
  folder,
  name,
  query,
  onQueryChange,
  autoFocus,
  onOpenFile,
  onOpenFolder
}: Props) => {
  const [page, setPage] = useState({ folder, query, count: RESULTS_BATCH })
  // Reset during render so a new query or folder never paints the old batch.
  if (page.folder !== folder || page.query !== query) {
    setPage({ folder, query, count: RESULTS_BATCH })
  }
  const visibleCount =
    page.folder === folder && page.query === query ? page.count : RESULTS_BATCH
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
  // A walk cannot be cancelled. Only the current scan may publish its progress or
  // answer, even if the reader has left and returned to the same folder.
  const live = useRef(true)
  const fieldRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  // The index of the result that the batch just revealed, for the focus that follows
  // it: a keyboard reader who asked for more should land on the first new answer, not
  // stay on the button and tab back through the ones they have already heard.
  const revealRef = useRef<number | null>(null)

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

  // A different folder is a different search, and nothing read for the old one may
  // stand for the new one. The query itself is the page's and is reset on the path
  // change (folderView); this drops the answer - the progress, the findings, the
  // failure - and the cached scan with them, so returning to a folder already
  // searched starts a fresh read instead of reusing the scan of an earlier visit.
  useEffect(() => {
    setReading(null)
    setFound(null)
    setFailed(false)
    scans.current = null
  }, [folder])

  const needle = query.trim()
  const asked = isSearchQuery(query)
  const answered = found?.folder === folder

  useEffect(() => {
    if (!asked) return

    const startedFor = folder
    let scan = scans.current
    const mine = () => live.current && scans.current === scan

    if (!scan || scan.folder !== startedFor) {
      const folders: string[] = []
      let rootUnreadable = false
      let unreadableFolders = 0
      const promise = walkDrivePaths(
        async (path) => {
          const node = await listFolder(path)
          if (!node) {
            if (path === startedFor) rootUnreadable = true
            else unreadableFolders++
          }
          return node
        },
        WALK_CONCURRENCY,
        startedFor,
        (path) => folders.push(path)
      )
        .then((files) =>
          rootUnreadable
            ? null
            : readContents(files, readFileText, (done, total) => {
                if (mine()) setReading({ done, total })
              }).then((result) => ({
                folder: startedFor,
                files,
                folders,
                unreadableFolders,
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
        folders: answered ? (found?.folders ?? []) : [],
        contents: answered ? (found?.contents ?? []) : []
      }),
    [query, found, answered]
  )

  const shown = Math.min(visibleCount, hits.length)
  const unreadableFolders = answered ? (found?.unreadableFolders ?? 0) : 0

  // One batch more, and never past the last result: the final batch is whatever is
  // left rather than a full one. The next count is derived from what is on screen, so
  // a click and a key that both reach this in one turn cannot add two batches.
  const expand = (forKeyboard: boolean) => {
    const next = Math.min(shown + RESULTS_BATCH, hits.length)

    if (next <= shown) return

    if (forKeyboard) revealRef.current = shown

    setPage({ folder, query, count: next })
  }

  // The revealed results exist only after the render that added them, so the focus
  // moves in an effect rather than in the handler that asked for more.
  useEffect(() => {
    const index = revealRef.current

    if (index === null) return

    const revealed =
      listRef.current?.querySelectorAll<HTMLElement>('[role="button"]')
    const target = revealed?.[index]

    if (!target) return

    revealRef.current = null
    target.focus()
  }, [visibleCount, hits])

  // The button is a native one, so the browser would act on Enter and Space itself and
  // leave focus on the button. Handling the keys here keeps one activation per press
  // and lets the new results take focus, which is where a keyboard reader is going.
  const onShowMoreKeyDown: KeyboardEventHandler<HTMLButtonElement> = (
    event
  ) => {
    if (event.key !== 'Enter' && event.key !== ' ') return

    event.preventDefault()
    expand(true)
  }

  const note = [
    unreadableFolders
      ? `${unreadableFolders} subfolder${unreadableFolders === 1 ? '' : 's'} could not be read; results may be incomplete.`
      : '',
    scanNote(answered ? (found?.scan ?? null) : null)
  ]
    .filter(Boolean)
    .join(' ')
  const busy = reading
    ? reading.total
      ? `Reading ${reading.done} of ${reading.total} files…`
      : 'Reading this folder…'
    : ''

  const nothing = () => {
    if (!asked) {
      return `Searches this folder's folders and files by name, and the text inside files.`
    }
    if (busy) return busy
    if (failed) return 'This folder could not be read.'
    if (!answered) return 'Reading this folder…'
    if (unreadableFolders) return 'No matches found in the folders searched.'

    return `Nothing in this folder matches “${needle}”.`
  }

  return (
    <Box sx={{ mb: 2 }}>
      <TextField
        size="small"
        inputRef={fieldRef}
        value={query}
        autoFocus={autoFocus}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder={`Search in ${name}`}
        sx={{ width: 320 }}
        slotProps={{
          htmlInput: { 'aria-label': `Search folders and files in ${name}` }
        }}
      />

      {hits.length ? (
        <>
          <List dense ref={listRef} sx={{ py: 0, maxWidth: 720 }}>
            {hits.slice(0, shown).map((hit) => (
              <ListItemButton
                key={`${hit.kind}:${hit.title}:${hit.detail}`}
                onClick={() => {
                  if (hit.folderPath) onOpenFolder(hit.folderPath)
                  else if (hit.filePath) onOpenFile(hit.filePath)
                }}
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
          <Typography variant="caption" color="text.secondary" component="div">
            Showing {shown} of {hits.length} results
          </Typography>
          {shown < hits.length ? (
            <Button onClick={() => expand(false)} onKeyDown={onShowMoreKeyDown}>
              Show more
            </Button>
          ) : null}
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
