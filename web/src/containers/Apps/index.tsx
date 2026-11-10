import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import axios from 'axios'
import {
  Avatar,
  Box,
  Button,
  CssBaseline,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Snackbar,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography
} from '@mui/material'
import {
  DeleteOutlined,
  GridViewOutlined,
  OpenInNew,
  ViewListOutlined
} from '@mui/icons-material'

import AppTile from '../../components/appTile'
import { AppContext, ModeType } from '../../context/appContext'
import { APP_STREAM_ROUTE, DEPLOY_ROUTE } from '../../utils'
import {
  RecentApp,
  recallRecentApps,
  rememberRecentApp
} from '../../utils/recent'

interface StreamedApp {
  /** The app's identity, which is what an unpublish names and its URL carries. */
  id: string
  name: string
  appLoc: string
  logo: string | null
  url: string
  /** When the bundle was last published, or null for an older registry. */
  publishedAt: string | null
}

/** An app as the screen renders it, whichever view is showing. */
interface AppEntry {
  title: string
  subtitle: string
  logo: string | null
  to?: string
  href?: string
  /** The server's publish date, where the bundle has one. */
  publishedAt?: string | null
  /** The registry entry behind a streamed app, which is what an unpublish names. */
  streamed?: StreamedApp
}

const defaultAppLogo = '/sasjs-logo.svg'

/** The view a caller last chose, per user, in localStorage. */
const viewKey = (username: string) =>
  `sasjs-apps-view:${String(username ?? '')
    .trim()
    .toLowerCase()}`

type AppsView = 'grid' | 'list'

const recallView = (username: string): AppsView => {
  try {
    return localStorage.getItem(viewKey(username)) === 'list' ? 'list' : 'grid'
  } catch {
    return 'grid'
  }
}

const rememberView = (username: string, view: AppsView): void => {
  try {
    localStorage.setItem(viewKey(username), view)
  } catch {
    // Storage unavailable: the choice survives the page, not the browser.
  }
}

/**
 * Every app streamed to this deployment, as this caller may open it.
 *
 * The list comes from the server, already filtered to what the caller holds a
 * grant on, so an entry is never a dead end. Two views: tiles for recognising an
 * app by its logo, and a list for scanning names, locations and dates when there
 * are many. The choice is remembered per user.
 *
 * Studio, the API explorer and the docs are not here: they are tabs in the
 * header, on every screen, so repeating them as tiles only made the list longer
 * without making anything easier to find.
 *
 * A caller who may publish may also take an app back down, which is what the bin
 * on a list row does - the same route, `DELETE /SASjsApi/drive/deploy`, so the
 * grant that put an app there is the one that removes it.
 */
const Apps = () => {
  const appContext = useContext(AppContext)
  const [apps, setApps] = useState<StreamedApp[]>([])
  const [loadingApps, setLoadingApps] = useState(true)
  const [pendingDelete, setPendingDelete] = useState<StreamedApp | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [failure, setFailure] = useState('')

  const username = appContext.username
  const canUseAppStream = appContext.isAuthorizedFor(APP_STREAM_ROUTE)
  // Publishing and unpublishing are one route, so a caller holding it may do
  // both. Desktop mode has no permission model, which is why the mode check is
  // here as well.
  const canUnpublish =
    appContext.mode === ModeType.Desktop ||
    appContext.isAdmin ||
    appContext.isAuthorizedFor(DEPLOY_ROUTE)

  const [view, setView] = useState<AppsView>(() => recallView(username))
  const [recent] = useState<RecentApp[]>(() => recallRecentApps(username))

  useEffect(() => {
    if (!canUseAppStream) {
      setLoadingApps(false)
      return
    }

    let cancelled = false

    axios
      // The canonical spelling, for the same reason as the home screen: the
      // server answers both, and the mock host answers this one today.
      .get('/AppStream/apps.json')
      .then((res) => {
        if (!cancelled) setApps(res.data?.apps ?? [])
      })
      .catch(() => {
        // A deployment with no apps, or no grant to list them, shows the
        // built-in tiles rather than an error - there is nothing to fix here.
        if (!cancelled) setApps([])
      })
      .finally(() => {
        if (!cancelled) setLoadingApps(false)
      })

    return () => {
      cancelled = true
    }
  }, [canUseAppStream])

  const entries: AppEntry[] = apps.map((app) => ({
    title: app.name,
    subtitle: app.appLoc,
    logo: app.logo ?? defaultAppLogo,
    href: app.url,
    publishedAt: app.publishedAt,
    streamed: app
  }))

  /** The publish date, as a reader reads it - or nothing when there is none. */
  const published = (entry: AppEntry): string => {
    if (!entry.publishedAt) return ''

    const when = new Date(entry.publishedAt)
    if (isNaN(when.getTime())) return ''

    return `published ${when.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })}`
  }

  /** The app's last open on this browser, if this browser has one. */
  const lastOpened = (entry: AppEntry): string => {
    const target = entry.href ?? entry.to ?? ''
    const match = recent.find((app) => (app.href ?? app.to ?? '') === target)
    if (!match) return ''

    return `last opened ${new Date(match.at).toLocaleDateString()}`
  }

  const navigate = useNavigate()

  /** Follows an entry, recording the open first so the dashboard sees it. */
  const open = (entry: AppEntry) => {
    remember(entry)()

    if (entry.href) window.open(entry.href, '_blank', 'noopener,noreferrer')
    else if (entry.to) navigate(entry.to)
  }

  const remember = (entry: AppEntry) => () =>
    rememberRecentApp(username, {
      title: entry.title,
      subtitle: entry.subtitle,
      logo: entry.logo,
      to: entry.to,
      href: entry.href
    })

  const changeView = (next: AppsView | null) => {
    if (!next) return
    setView(next)
    rememberView(username, next)
  }

  /** What the server said, or a plain sentence when it said nothing readable. */
  const refusal = (error: any): string => {
    const body = error?.response?.data

    if (typeof body === 'string' && body.trim()) return body.trim()
    if (typeof body?.message === 'string' && body.message.trim())
      return body.message.trim()

    return error?.message ?? 'The app could not be unpublished.'
  }

  /**
   * Takes the app out of the registry, so it stops being advertised and stops
   * being served. The bundle's files stay in the drive - removing those is a
   * different, far more dangerous act - which is why the dialog says so.
   */
  const unpublish = async (app: StreamedApp) => {
    setDeleting(true)

    try {
      // By id, and only by id: a label is shared by design (two folders may both
      // be called "report"), so a removal that named one could take down an app
      // nobody meant.
      await axios.delete('/SASjsApi/drive/deploy', {
        data: { id: app.id }
      })

      setApps((current) => current.filter((entry) => entry.id !== app.id))
      setPendingDelete(null)
    } catch (error: any) {
      setFailure(refusal(error))
      setPendingDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Box className="container" sx={{ p: 3 }}>
      <CssBaseline />
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          mb: 2,
          flexWrap: 'wrap'
        }}
      >
        <Typography variant="h5">Apps</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <ToggleButtonGroup
          size="small"
          exclusive
          value={view}
          onChange={(_event, next: AppsView | null) => changeView(next)}
          aria-label="App layout"
        >
          <ToggleButton value="grid" aria-label="Grid view">
            <Tooltip title="Grid view">
              <GridViewOutlined fontSize="small" />
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="list" aria-label="List view">
            <Tooltip title="List view">
              <ViewListOutlined fontSize="small" />
            </Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {view === 'grid' ? (
        <Grid container spacing={1.5}>
          {entries.map((entry) => (
            <Grid
              size={{ xs: 6, sm: 4, md: 3, lg: 2 }}
              key={entry.href ?? entry.to ?? entry.title}
              sx={{ minWidth: 0 }}
            >
              <AppTile
                title={entry.title}
                subtitle={entry.subtitle}
                logo={entry.logo}
                to={entry.to}
                href={entry.href}
                onOpen={remember(entry)}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <List dense disablePadding>
          {entries.map((entry) => (
            // The bin is the row's secondary action, beside the row rather than
            // inside it: a button nested in a button is invalid markup and gives
            // the row an accessible name that includes "Unpublish ...".
            <ListItem
              key={entry.href ?? entry.to ?? entry.title}
              disablePadding
              secondaryAction={
                canUnpublish &&
                entry.streamed && (
                  <Tooltip title="Unpublish this app">
                    <IconButton
                      size="small"
                      edge="end"
                      aria-label={`Unpublish ${entry.title}`}
                      onClick={() => {
                        setFailure('')
                        setPendingDelete(entry.streamed ?? null)
                      }}
                    >
                      <DeleteOutlined fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )
              }
            >
              <ListItemButton
                onClick={() => open(entry)}
                sx={{ borderRadius: 1, minWidth: 0 }}
              >
                <ListItemIcon sx={{ minWidth: 44 }}>
                  <Avatar
                    variant="rounded"
                    src={entry.logo ?? defaultAppLogo}
                    alt=""
                    sx={{ width: 28, height: 28 }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={entry.title}
                  secondary={[
                    entry.subtitle,
                    published(entry),
                    lastOpened(entry)
                  ]
                    .filter(Boolean)
                    .join(' - ')}
                  slotProps={{
                    primary: { variant: 'body2', noWrap: true },
                    secondary: { variant: 'caption', noWrap: true }
                  }}
                />
                {entry.href && <OpenInNew fontSize="small" />}
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      )}

      {!loadingApps && !apps.length && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
          {canUseAppStream
            ? 'No apps are published to this server yet. An administrator publishes one from Admin, and it appears here for everyone it is granted to.'
            : 'No apps are published here that you hold a grant on. An administrator grants access from Admin.'}
        </Typography>
      )}

      <Dialog
        open={pendingDelete !== null}
        onClose={() => (deleting ? undefined : setPendingDelete(null))}
        aria-labelledby="unpublish-title"
      >
        <DialogTitle id="unpublish-title">
          Unpublish {pendingDelete?.name}?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            The app stops being advertised and stops being served at{' '}
            <code>{pendingDelete?.url}</code>. The files in{' '}
            <code>{pendingDelete?.appLoc}</code> stay in the drive, so it can be
            published again - or the folder deleted, which is a separate and
            irreversible act.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingDelete(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={deleting}
            onClick={() => pendingDelete && unpublish(pendingDelete)}
          >
            {deleting ? 'Unpublishing...' : 'Unpublish'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(failure)}
        autoHideDuration={8000}
        onClose={() => setFailure('')}
        message={failure}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  )
}

export default Apps
