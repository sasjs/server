import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

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

import axios from 'axios'

import { AppContext } from '../context/appContext'
import { APP_STREAM_ROUTE, FILE_TREE_ROUTE } from '../utils'
import { APPS_LISTING } from '../utils/appUrl'
import { walkDrivePaths } from '../utils/driveWalk'
import type { TreeNode } from '../utils/types'
import {
  AppRow,
  DocsEntry,
  Hit,
  Operation,
  Sources,
  kindLabel,
  matches,
  searchHint,
  searchLabel,
  searchScope
} from '../utils/search'

/**
 * The two sources a build writes, fetched once each and kept for the session.
 *
 * The documentation index is the one MkDocs builds for its own search - about
 * 163 entries and 110 KB - and the operations list is written from the spec at
 * build time, so neither search needs the server to answer anything: the same
 * code works on a static host. Shared at module level because every keystroke
 * would otherwise re-request them, and because neither changes while a page is
 * open - they are files from the build.
 */
let docsSource: Promise<DocsEntry[]> | null = null
let operationsSource: Promise<Operation[]> | null = null
/** The drive's file paths: one walk per session, not one per keystroke. */
let driveSource: Promise<string[]> | null = null

const loadDocs = () =>
  (docsSource ??= fetch('/documentation/search/search_index.json')
    .then((response) => (response.ok ? response.json() : { docs: [] }))
    .then((index: { docs?: DocsEntry[] }) => index.docs ?? [])
    .catch(() => [] as DocsEntry[]))

const loadOperations = () =>
  (operationsSource ??= fetch('/api-operations.json')
    .then((response) => (response.ok ? response.json() : []))
    .then((operations: Operation[]) => operations ?? [])
    .catch(() => [] as Operation[]))

/**
 * The apps this caller may open, from the same listing the Apps screen draws.
 *
 * Requested through the shared axios instance, as every other reader of this
 * listing is: it carries `baseURL: apiBaseUrl` - the API's own origin under
 * `npm start`, which the dev server answers only for `/SASjsApi`, `/api` and
 * `/docs` - and `withCredentials`, without which a deployment on another origin
 * drops the session cookie. A bare `fetch` here 404s under `npm start` and then
 * reports "nothing matches" under a placeholder promising "Search apps", which is
 * the failure this search exists to remove.
 *
 * Not cached, unlike the build's own files: an app can be published or taken down
 * between two visits to the screen, and a result that opens a page which is no
 * longer served is worse than the request it would have saved.
 */
const loadApps = () =>
  axios
    .get(APPS_LISTING)
    .then((response) => (response.data?.apps ?? []) as AppRow[])
    .catch(() => [] as AppRow[])

/**
 * One folder's immediate children, as the explorer reads them.
 *
 * Read through the shared axios instance for the reason `loadApps` gives: a bare
 * `fetch` of `/SASjsApi/...` 404s under `npm start` and drops the session cookie
 * on a deployment that answers from another origin.
 *
 * A folder that cannot be read answers null rather than throwing. That is not a
 * failure unique to a search: the caller may hold no grant for that folder, or
 * the folder may have gone between the listing and the request, and either way
 * the rest of the drive is still worth walking - see `walkDrivePaths`.
 */
const listFolder = (folderPath: string) =>
  axios
    .get('/SASjsApi/drive/fileTree', {
      params: { _folderPath: folderPath }
    })
    .then((response) =>
      response.data?.status === 'success'
        ? (response.data.tree as TreeNode)
        : null
    )
    .catch(() => null)

/**
 * Every file path on the drive, walked once and kept for the session.
 *
 * Kept, unlike the apps listing, because the walk is not one request but one per
 * folder: asking again on each keystroke, or each time the reader comes back to
 * Studio, would spend a request per folder on every visit. The cost of keeping it
 * is that a file written in this page is found after a reload - which is when the
 * explorer finds it too.
 *
 * A walk that found nothing is not kept: an empty drive and a session that was
 * not ready when the box asked give the same answer, and only the second of those
 * is worth retrying.
 */
const loadDrive = () =>
  (driveSource ??= walkDrivePaths(listFolder).then((files) => {
    if (!files.length) driveSource = null

    return files
  }))

/** No list but the ones this screen searches is loaded; see `searchScope`. */
const empty: Sources = { docs: [], operations: [], apps: [], files: [] }

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
          {kindLabel(hit.kind)}
        </Typography>
      </ListItemButton>
    ))}
  </List>
)

/**
 * One search box, answering for the screen it is on.
 *
 * On the documentation it searches the documentation, on the API explorer the
 * operations, on the apps screen the published apps, and in Studio the files on
 * the drive - see `searchScope`. The dashboard and settings have nothing of their
 * own to search, so there it keeps answering both build-time lists, which is what
 * it always did.
 *
 * Two shapes of the same search: a field in the bar on a screen with room for it,
 * and a magnifier that opens a dialog where there is not. Both take `Ctrl+K` (or
 * `Cmd+K`), the shortcut a reader is most likely to try.
 */
const Search = () => {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const appContext = useContext(AppContext)
  // An app is only searchable for a caller the listing would answer: without the
  // grant the screen shows the built-in tiles instead, and `searchScope` keeps the
  // both-lists box rather than promising a list it may not read. The drive is the
  // same on the grant the explorer reads folders with.
  const canListApps = appContext.isAuthorizedFor(APP_STREAM_ROUTE)
  const canListDrive = appContext.isAuthorizedFor(FILE_TREE_ROUTE)
  const scope = searchScope(pathname, canListApps, canListDrive)

  const [query, setQuery] = useState('')
  const [sources, setSources] = useState<Sources>(empty)
  const [searched, setSearched] = useState(false)
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [open, setOpen] = useState(false)
  const fieldRef = useRef<HTMLInputElement>(null)

  // Warm what this screen searches while the reader is doing something else: the
  // first keystroke then filters rather than waits. Landing on another screen
  // loads what that one needs, and only that one - the whole point of the scope
  // is that the box does not answer from lists the screen has no use for.
  useEffect(() => {
    let live = true

    setSearched(false)

    Promise.all([
      scope === 'docs' || scope === 'all' ? loadDocs() : [],
      scope === 'api' || scope === 'all' ? loadOperations() : [],
      // only ever 'apps' when the grant is held: see `searchScope`
      scope === 'apps' ? loadApps() : [],
      // the drive is a walk, so the box says "Searching…" for its duration
      // rather than offering half a drive to search
      scope === 'drive' ? loadDrive() : []
    ]).then(([docs, operations, apps, files]) => {
      if (!live) return

      setSources({ docs, operations, apps, files })
      setSearched(true)
    })

    return () => {
      live = false
    }
  }, [scope])

  // Derived, not stored: the results are a function of the query, the screen and
  // what has loaded. Every keystroke asks the same lists, and an answer that
  // arrives late cannot replace a newer one - there is no answer to arrive, only
  // a re-render of the same inputs.
  const hits = useMemo(
    () => matches(scope, query, sources),
    [scope, query, sources]
  )

  const choose = useCallback(
    (hit: Hit) => {
      setOpen(false)
      setAnchor(null)
      setQuery('')

      // An app is not a screen of this application: it opens beside the portal,
      // as its tile does, so the reader keeps the listing they searched.
      if (hit.href) window.open(hit.href, '_blank', 'noopener,noreferrer')
      else if (hit.to) navigate(hit.to)
    },
    [navigate]
  )

  const hint = searchHint(scope)
  const label = searchLabel(scope)
  const asked = query.trim().length >= 2

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
          placeholder={hint}
          onFocus={(event) => setAnchor(event.currentTarget)}
          onChange={(event) => setQuery(event.target.value)}
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
            htmlInput: { 'aria-label': label }
          }}
        />
      </Box>

      <IconButton
        color="inherit"
        sx={{ display: { xs: 'inline-flex', md: 'none' } }}
        aria-label={label}
        onClick={() => setOpen(true)}
      >
        <SearchIcon />
      </IconButton>

      {/* Mounted only when it has somewhere to open: a Popover is a modal, and
          one left mounted while closed covers the page with a backdrop that
          swallows the click meant for what is underneath it. */}
      {anchor && asked ? (
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
              {searched ? `Nothing matches “${query}”.` : 'Searching…'}
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
            placeholder={hint}
            onChange={(event) => setQuery(event.target.value)}
            slotProps={{
              htmlInput: { 'aria-label': label }
            }}
          />
          <Box sx={{ mt: 1 }}>
            {hits.length ? (
              <Results hits={hits} onChoose={choose} />
            ) : (
              <Typography variant="body2" color="text.secondary">
                {!asked ? hint : searched ? 'Nothing matches.' : 'Searching…'}
              </Typography>
            )}
          </Box>
        </Box>
      </Dialog>
    </>
  )
}

export default Search
