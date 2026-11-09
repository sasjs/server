import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  Box,
  Dialog,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Popover,
  TextField,
  Typography
} from '@mui/material'
import { Search as SearchIcon } from '@mui/icons-material'

/** A documentation page or an API operation, as one list. */
interface Hit {
  kind: 'docs' | 'api'
  title: string
  detail: string
  /** The app's route for it. */
  to: string
}

interface Operation {
  method: string
  path: string
  summary: string
}

interface DocsEntry {
  location: string
  title: string
  text: string
}

/**
 * Both sources, fetched once and kept for the session.
 *
 * The documentation index is the one MkDocs builds for its own search - 163
 * entries, about 110 KB - and the operations list is written from the spec at
 * build time, so neither search needs the server to answer anything: the same
 * code works on a static host. Shared at module level because every keystroke
 * would otherwise re-request them.
 */
let sources: Promise<{ docs: DocsEntry[]; operations: Operation[] }> | null =
  null

const loadSources = () =>
  (sources ??= Promise.all([
    fetch('/documentation/search/search_index.json')
      .then((response) => (response.ok ? response.json() : { docs: [] }))
      .then((index: { docs?: DocsEntry[] }) => index.docs ?? [])
      .catch(() => [] as DocsEntry[]),
    fetch('/api-operations.json')
      .then((response) => (response.ok ? response.json() : []))
      .then((operations: Operation[]) => operations ?? [])
      .catch(() => [] as Operation[])
  ]).then(([docs, operations]) => ({ docs, operations })))

/** How many results are worth showing: enough to choose from, not a page. */
const LIMIT = 12

/**
 * Where the query matches decides the order.
 *
 * A page whose title contains the word is what the reader meant; a page that
 * mentions it in passing is a second best; and an operation that mentions it in
 * its summary is weaker than one whose path contains it. Without this, a query
 * like "permissions" returns twelve API operations and never shows the page
 * called Permissions.
 */
const score = (needle: string, strong: string, weak: string) => {
  if (strong.toLowerCase().includes(needle)) return 2
  if (weak.toLowerCase().includes(needle)) return 1

  return 0
}

const matches = (query: string, docs: DocsEntry[], operations: Operation[]) => {
  const needle = query.trim().toLowerCase()

  if (needle.length < 2) return [] as Hit[]

  const scored: { hit: Hit; rank: number }[] = []

  for (const entry of operations) {
    const line = `${entry.method} ${entry.path}`
    const rank = score(needle, line, entry.summary)

    if (rank)
      scored.push({
        rank,
        hit: {
          kind: 'api',
          title: line,
          detail: entry.summary,
          to: '/api'
        }
      })
  }

  for (const entry of docs) {
    // `apps/#creating-apps` is a section of a page; the reader is taken to the
    // page, which is what the framed route can address.
    const location = entry.location.split('#')[0]
    const rank = score(needle, entry.title, entry.text)

    if (rank)
      scored.push({
        rank,
        hit: {
          kind: 'docs',
          title: entry.title || location || 'Documentation',
          detail: location ? `/${location}` : '/',
          to: `/docs/${location}`
        }
      })
  }

  return scored
    .sort(
      (first, second) =>
        second.rank - first.rank ||
        first.hit.title.localeCompare(second.hit.title)
    )
    .slice(0, LIMIT)
    .map((entry) => entry.hit)
}

const Results = ({
  hits,
  onChoose
}: {
  hits: Hit[]
  onChoose: (hit: Hit) => void
}) => (
  <List dense sx={{ py: 0, maxHeight: '60vh', overflow: 'auto' }}>
    {hits.map((hit) => (
      <ListItemButton
        key={`${hit.kind}:${hit.title}:${hit.detail}`}
        onClick={() => onChoose(hit)}
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
          {hit.kind === 'api' ? 'API' : 'Docs'}
        </Typography>
      </ListItemButton>
    ))}
  </List>
)

/**
 * One search box for the documentation and the API.
 *
 * Two shapes of the same search: a field in the bar on a screen with room for
 * it, and a magnifier that opens a dialog where there is not. Both take
 * `Ctrl+K` (or `Cmd+K`), the shortcut a reader is most likely to try.
 */
const Search = () => {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<Hit[]>([])
  const [loaded, setLoaded] = useState(false)
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [open, setOpen] = useState(false)
  const fieldRef = useRef<HTMLInputElement>(null)
  /** The query whose results are still wanted; see `run`. */
  const latest = useRef('')

  // Warm both sources while the reader is doing something else: the first
  // keystroke then filters rather than waits.
  useEffect(() => {
    loadSources().then(() => setLoaded(true))
  }, [])

  const run = useCallback((value: string) => {
    setQuery(value)
    latest.current = value

    if (value.trim().length < 2) {
      setHits([])
      return
    }

    loadSources().then(({ docs, operations }) => {
      setLoaded(true)

      // Every keystroke asks, and the answers can arrive out of order - a list
      // from "permi" replacing the one for "permissions" is the flicker that
      // makes a search box feel broken. Only the newest question is answered.
      if (latest.current !== value) return

      setHits(matches(value, docs, operations))
    })
  }, [])

  const choose = useCallback(
    (hit: Hit) => {
      setOpen(false)
      setAnchor(null)
      setQuery('')
      setHits([])
      navigate(hit.to)
    },
    [navigate]
  )

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'k' || !(event.metaKey || event.ctrlKey))
        return

      event.preventDefault()

      const field = fieldRef.current

      // The field is only rendered where the bar has room for it; on a narrow
      // screen it is `display: none`, and focusing a hidden input does nothing -
      // the shortcut would open a popover anchored to a zero-size element.
      if (field && field.offsetParent !== null) {
        field.focus()
        setAnchor(field)
        return
      }

      setOpen(true)
    }

    window.addEventListener('keydown', onKeyDown)

    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <>
      <Box sx={{ display: { xs: 'none', md: 'block' }, mr: 1, width: 240 }}>
        <TextField
          inputRef={fieldRef}
          size="small"
          fullWidth
          value={query}
          placeholder="Search docs and API"
          onFocus={(event) => setAnchor(event.currentTarget)}
          onChange={(event) => run(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setAnchor(null)
              setQuery('')
            }
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              sx: { backgroundColor: 'background.paper', borderRadius: 1 }
            },
            htmlInput: { 'aria-label': 'Search the documentation and the API' }
          }}
        />
      </Box>

      <IconButton
        color="inherit"
        sx={{ display: { xs: 'inline-flex', md: 'none' } }}
        aria-label="Search the documentation and the API"
        onClick={() => setOpen(true)}
      >
        <SearchIcon />
      </IconButton>

      {/* Mounted only when it has somewhere to open: a Popover is a modal, and
          one left mounted while closed covers the page with a backdrop that
          swallows the click meant for what is underneath it. */}
      {anchor && query.length >= 2 ? (
        <Popover
          open
          anchorEl={anchor}
          // The reader is typing into the field above; a popover that takes
          // focus ends the sentence two characters in.
          disableAutoFocus
          disableEnforceFocus
          disableRestoreFocus
          onClose={() => setAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          slotProps={{ paper: { sx: { width: 420, mt: 1 } } }}
        >
          {hits.length ? (
            <Results hits={hits} onChoose={choose} />
          ) : (
            <Typography variant="body2" sx={{ p: 2 }} color="text.secondary">
              {loaded ? `Nothing matches “${query}”.` : 'Searching…'}
            </Typography>
          )}
        </Popover>
      ) : null}

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <Box sx={{ p: 2 }}>
          <TextField
            autoFocus
            fullWidth
            size="small"
            value={query}
            placeholder="Search docs and API"
            onChange={(event) => run(event.target.value)}
            slotProps={{
              htmlInput: {
                'aria-label': 'Search the documentation and the API'
              }
            }}
          />
          <Box sx={{ mt: 1 }}>
            {hits.length ? (
              <Results hits={hits} onChoose={choose} />
            ) : (
              <Typography variant="body2" color="text.secondary">
                {loaded ? 'Nothing matches.' : 'Searching…'}
              </Typography>
            )}
          </Box>
        </Box>
      </Dialog>
    </>
  )
}

export default Search
