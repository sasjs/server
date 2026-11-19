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
 * the drive - see `searchScope`. The dashboard has no subject of its own, so it
 * answers from all four: the reader who has just signed in is asking where a
 * thing is, not which screen holds it. Settings keeps the both-lists search,
 * because a setting is a screen of this application and the docs and the API are
 * what explain it.
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
  const [queryScope, setQueryScope] = useState(scope)
  const [queryContext, setQueryContext] = useState<object | null>(null)
  const [sources, setSources] = useState<Sources>(empty)
  const [searched, setSearched] = useState(false)
  // Whether the drive walk a query started is still out. The lists a screen
  // loads on entry answer on the next tick, but the walk is one request per
  // folder, and "nothing matches" while it is still reading the drive would be
  // the one answer a search of everything must not give early.
  const [walking, setWalking] = useState(false)
  const [loadedScope, setLoadedScope] = useState(scope)
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [open, setOpen] = useState(false)
  const fieldRef = useRef<HTMLInputElement>(null)
  // Search unmounts at sign-out. Keep its cache here, not at module scope, so a
  // later caller cannot see the previous session's paths. A grant or user change
  // also discards the cache, including any walk still in flight.
  const driveCache = useRef<{
    userId?: string
    username: string
    allowed: boolean
    promise: Promise<string[]> | null
    /**
     * The files the walk found, kept here rather than only in state. The two
     * effects below race - a small drive can answer before the apps listing does -
     * and a screen that loads its lists second must not blank files that are
     * still this caller's answer.
     */
    files?: string[]
    /**
     * Whether this caller's drive has been read once already, empty or not. A
     * drive with no files leaves no `promise` to reuse, and without this a mixed
     * screen would walk it again on every keystroke.
     */
    walked?: boolean
  } | null>(null)
  if (
    !driveCache.current ||
    driveCache.current.userId !== appContext.userId ||
    driveCache.current.username !== appContext.username ||
    driveCache.current.allowed !== canListDrive
  ) {
    driveCache.current = {
      userId: appContext.userId,
      username: appContext.username,
      allowed: canListDrive,
      promise: null
    }
  }

  const cache = driveCache.current
  const loadedContext = useRef(cache)
  const authenticated = useRef(true)
  useEffect(() => {
    authenticated.current = true
    return () => {
      authenticated.current = false
    }
  }, [])
  // A query belongs to the screen where it was typed. Carrying it into Studio
  // would start an expensive walk without a search initiated there.
  const currentQuery =
    queryScope === scope && queryContext === cache ? query : ''
  const asked = currentQuery.trim().length >= 2
  const updateQuery = (value: string) => {
    setQueryScope(scope)
    setQueryContext(cache)
    setQuery(value)
  }

  useEffect(() => {
    setQuery('')
    setQueryScope(scope)
    setQueryContext(cache)
  }, [scope, cache])

  // What the screen answers without being asked. The two build-time indexes are
  // module-cached and the apps listing is one request, so this settles on the
  // next tick and every screen opens with its list already in hand.
  useEffect(() => {
    let live = true

    setSearched(false)
    setWalking(false)

    // A drive-only screen has nothing to warm: its one source is the walk, which
    // the effect below starts on a real query.
    if (scope === 'drive') return

    Promise.all([
      scope === 'docs' || scope === 'all' || scope === 'everything'
        ? loadDocs()
        : [],
      scope === 'api' || scope === 'all' || scope === 'everything'
        ? loadOperations()
        : [],
      scope === 'apps' || scope === 'everything' ? loadApps() : []
    ]).then(([docs, operations, apps]) => {
      if (!live || driveCache.current !== cache) return

      loadedContext.current = cache
      setSources({ docs, operations, apps, files: cache.files ?? [] })
      setLoadedScope(scope)
      setSearched(true)
    })

    return () => {
      live = false
    }
  }, [scope, cache])

  // The drive takes one request per folder, so start only on a real query.
  //
  // A drive-only screen observes the query itself, so changing it retries a walk
  // that came back empty. A mixed screen asks once: `walked` remembers that the
  // drive has been read whether or not it held anything, because an empty drive
  // leaves no promise to reuse and following the query there would walk the whole
  // drive again on every letter.
  const walkKey =
    scope === 'drive'
      ? currentQuery
      : scope === 'everything' && asked
        ? cache.promise || cache.walked
          ? 'answered'
          : currentQuery
        : ''

  useEffect(() => {
    if (!walkKey || !asked) return

    let live = true

    if (!cache.promise) {
      const walk = walkDrivePaths((folder) =>
        authenticated.current && driveCache.current === cache
          ? listFolder(folder)
          : Promise.resolve(null)
      ).then((files) => {
        // Empty can mean the session was not ready; allow a later retry.
        if (!files.length && cache.promise === walk) cache.promise = null
        return files
      })
      cache.promise = walk
    }

    setWalking(true)

    // Files are merged into what the screen already shows rather than replacing
    // it: on the dashboard the docs, the operations and the apps are already on
    // screen, and a walk that took a second must not blank them while it runs.
    cache.promise
      .then((files) => {
        if (!live || driveCache.current !== cache) return

        loadedContext.current = cache
        cache.files = files
        cache.walked = true
        setWalking(false)
        setSources((previous) => ({ ...previous, files }))
        setLoadedScope(scope)
        setSearched(true)
      })
      .catch(() => {
        // `walkDrivePaths` answers null for a folder it cannot read, so this
        // branch is only reached if the walk itself throws. Left unhandled it
        // would keep the box saying "Searching…" for ever and surface as an
        // unhandled rejection; instead the walk is forgotten - not marked as
        // walked - so the next query tries again, as a drive-only screen does,
        // and the lists already on screen stay.
        if (!live || driveCache.current !== cache) return

        cache.promise = null
        setWalking(false)
        setLoadedScope(scope)
        setSearched(true)
      })

    return () => {
      live = false
    }
  }, [scope, walkKey, cache])

  // Derived, not stored: the results are a function of the query, the screen and
  // what has loaded. Every keystroke asks the same lists, and an answer that
  // arrives late cannot replace a newer one - there is no answer to arrive, only
  // a re-render of the same inputs.
  const hits = useMemo(
    () =>
      matches(
        scope,
        currentQuery,
        searched && loadedScope === scope && loadedContext.current === cache
          ? sources
          : empty
      ),
    [scope, currentQuery, sources, searched, loadedScope, cache]
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
          value={currentQuery}
          placeholder={hint}
          onFocus={(event) => setAnchor(event.currentTarget)}
          onChange={(event) => updateQuery(event.target.value)}
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
              {searched && !walking
                ? `Nothing matches “${query}”.`
                : 'Searching…'}
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
            value={currentQuery}
            placeholder={hint}
            onChange={(event) => updateQuery(event.target.value)}
            slotProps={{
              htmlInput: { 'aria-label': label }
            }}
          />
          <Box sx={{ mt: 1 }}>
            {hits.length ? (
              <Results hits={hits} onChoose={choose} />
            ) : (
              <Typography variant="body2" color="text.secondary">
                {!asked
                  ? hint
                  : searched && !walking
                    ? 'Nothing matches.'
                    : 'Searching…'}
              </Typography>
            )}
          </Box>
        </Box>
      </Dialog>
    </>
  )
}

export default Search
