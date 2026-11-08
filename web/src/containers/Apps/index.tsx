import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import axios from 'axios'
import {
  Avatar,
  Box,
  CssBaseline,
  Grid,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography
} from '@mui/material'
import {
  GridViewOutlined,
  OpenInNew,
  ViewListOutlined
} from '@mui/icons-material'

import AppTile from '../../components/appTile'
import { AppContext } from '../../context/appContext'
import { APP_STREAM_ROUTE, STUDIO_ROUTE } from '../../utils'
import {
  RecentApp,
  recallRecentApps,
  rememberRecentApp
} from '../../utils/recent'

interface StreamedApp {
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
 * Every app this caller can open: the built-in screens first, then every app
 * streamed to this deployment.
 *
 * The streamed list comes from the server, already filtered to what the caller
 * holds a grant on, so an entry is never a dead end. Two views: tiles for
 * recognising an app by its logo, and a list for scanning names and locations
 * when there are many. The choice is remembered per user.
 *
 * Neither view can show when an app was published - the listing carries no
 * date. What it can show is when this browser last opened it, which is what the
 * dashboard's "recently used" is built from, so the list view marks those.
 */
const Apps = () => {
  const appContext = useContext(AppContext)
  const [apps, setApps] = useState<StreamedApp[]>([])
  const [loadingApps, setLoadingApps] = useState(true)

  const username = appContext.username
  const canUseAppStream = appContext.isAuthorizedFor(APP_STREAM_ROUTE)
  const canUseStudio = appContext.isAuthorizedFor(STUDIO_ROUTE)

  const [view, setView] = useState<AppsView>(() => recallView(username))
  const [recent] = useState<RecentApp[]>(() => recallRecentApps(username))

  useEffect(() => {
    if (!canUseAppStream) {
      setLoadingApps(false)
      return
    }

    let cancelled = false

    axios
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

  const entries: AppEntry[] = [
    ...(canUseStudio
      ? [
          {
            title: 'Studio',
            subtitle: 'Run ad hoc code',
            logo: defaultAppLogo,
            to: '/SASjsStudio'
          }
        ]
      : []),
    {
      title: 'API Explorer',
      subtitle: 'Browse the REST API',
      logo: defaultAppLogo,
      to: '/SASjsApiDocs'
    },
    ...apps.map((app) => ({
      title: app.name,
      subtitle: app.appLoc,
      logo: app.logo ?? defaultAppLogo,
      href: app.url,
      publishedAt: app.publishedAt
    }))
  ]

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
            <ListItemButton
              key={entry.href ?? entry.to ?? entry.title}
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
                secondary={[entry.subtitle, published(entry), lastOpened(entry)]
                  .filter(Boolean)
                  .join(' - ')}
                slotProps={{
                  primary: { variant: 'body2', noWrap: true },
                  secondary: { variant: 'caption', noWrap: true }
                }}
              />
              {entry.href && <OpenInNew fontSize="small" />}
            </ListItemButton>
          ))}
        </List>
      )}

      {!loadingApps && !apps.length && !canUseStudio && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
          No apps are published to this server yet. An administrator publishes
          one from Admin, and it appears here for everyone it is granted to.
        </Typography>
      )}
    </Box>
  )
}

export default Apps
