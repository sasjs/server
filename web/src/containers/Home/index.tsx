import { useContext, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import axios from 'axios'
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  Grid,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography
} from '@mui/material'
import { DeleteSweep, InsertDriveFileOutlined } from '@mui/icons-material'

import AppTile from '../../components/appTile'
import { AppContext } from '../../context/appContext'
import { APP_STREAM_ROUTE, STUDIO_ROUTE } from '../../utils'
import { ApiHost, apiHost } from '../../utils/host'
import {
  RecentApp,
  RecentFile,
  clearDashboardHistory,
  recallRecentApps,
  recallRecentFiles,
  recallSignIns
} from '../../utils/recent'

/** "today at 14:05", "yesterday at 09:12", or the date - never a bare ISO stamp. */
const describeWhen = (iso: string): string => {
  const then = new Date(iso)
  if (isNaN(then.getTime())) return ''

  const time = then.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit'
  })
  const today = new Date()
  const midnight = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  )
  const days = Math.floor((midnight.getTime() - then.getTime()) / 86400000)

  if (days < 1) return `today at ${time}`
  if (days === 1) return `yesterday at ${time}`

  return then.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: then.getFullYear() === today.getFullYear() ? undefined : 'numeric'
  })
}

/** One label/value pair in the server card. */
const Fact = (props: { label: string; children: React.ReactNode }) => (
  <Box sx={{ minWidth: 0 }}>
    <Typography
      variant="caption"
      color="text.secondary"
      component="div"
      sx={{ display: 'block' }}
    >
      {props.label}
    </Typography>
    <Typography
      variant="body2"
      noWrap
      title={typeof props.children === 'string' ? props.children : undefined}
    >
      {props.children}
    </Typography>
  </Box>
)

/**
 * The dashboard: what this instance is, who you are, and what you were doing.
 *
 * Apps live on their own tab - a grid that grows with the deployment belongs on
 * a screen of its own - so the landing page answers the questions a returning
 * reader actually has: what am I looking at, where was I, and what is on this
 * server. The two lists are this browser's memory of this user, per username,
 * and they are clearable: a shared browser is a normal way to use this app.
 */
const Home = () => {
  const appContext = useContext(AppContext)
  const username = appContext.username

  const [historyVersion, setHistoryVersion] = useState(0)
  const [appsAvailable, setAppsAvailable] = useState<number | null>(null)
  const [filesInHome, setFilesInHome] = useState<number | null>(null)

  const apps = useMemo<RecentApp[]>(
    () => recallRecentApps(username),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [username, historyVersion]
  )
  const files = useMemo<RecentFile[]>(
    () => recallRecentFiles(username),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [username, historyVersion]
  )
  const signIns = useMemo<string[]>(
    () => recallSignIns(username),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [username, historyVersion]
  )

  // The list is newest first, so the previous sign-in is the second entry: a
  // single value written at login would always read "now".
  const previousSignIn = signIns[1] ? describeWhen(signIns[1]) : ''

  const canUseStudio = appContext.isAuthorizedFor(STUDIO_ROUTE)
  const canUseAppStream = appContext.isAuthorizedFor(APP_STREAM_ROUTE)

  /** Where this page's API answers come from - the host states it. */
  const [host] = useState<ApiHost>(apiHost)

  useEffect(() => {
    if (!canUseAppStream) {
      setAppsAvailable(canUseStudio ? 2 : 1)
      return
    }

    let cancelled = false

    axios
      .get('/AppStream/apps.json')
      .then((res) => {
        if (cancelled) return
        const streamed = Array.isArray(res.data?.apps)
          ? res.data.apps.length
          : 0
        setAppsAvailable(streamed + (canUseStudio ? 2 : 1))
      })
      .catch(() => {
        if (!cancelled) setAppsAvailable(canUseStudio ? 2 : 1)
      })

    return () => {
      cancelled = true
    }
  }, [canUseAppStream, canUseStudio])

  useEffect(() => {
    if (!username) return

    let cancelled = false

    // One readdir of the caller's own home: enough to say how much is there
    // without walking a drive that can hold anything.
    axios
      .get(
        `/SASjsApi/drive/fileTree?_folderPath=${encodeURIComponent(
          `/home/${username}`
        )}`
      )
      .then((res) => {
        if (cancelled) return
        const tree = res.data?.tree
        const children = Array.isArray(tree?.children) ? tree.children : []
        setFilesInHome(
          children.filter((child: { isFolder?: boolean }) => !child.isFolder)
            .length
        )
      })
      .catch(() => {
        if (!cancelled) setFilesInHome(null)
      })

    return () => {
      cancelled = true
    }
  }, [username])

  const clearHistory = () => {
    clearDashboardHistory(username)
    setHistoryVersion((version) => version + 1)
  }

  const runTimes = appContext.runTimes.length
    ? appContext.runTimes
        .map((runTime) => String(runTime).toUpperCase())
        .join(', ')
    : 'none reported'

  return (
    <Box className="container" sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Welcome{appContext.displayName ? `, ${appContext.displayName}` : ''}
      </Typography>
      {host === 'browser' ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          You are looking at{' '}
          <strong>SASjs Server running in this browser</strong> - there is no
          server behind this page. A service worker answers every API call, the
          drive is a snapshot built into the site, the programs that run are
          JavaScript, and the sign-in is a seeded demo identity. Every screen
          here - this dashboard, <strong>Studio</strong>, the API explorer,{' '}
          <strong>Docs</strong> and the apps - is the real interface, running
          against a host of its own.
        </Typography>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          You are talking to <strong>SASjs Server on this host</strong>. The API
          answers from the server process, the drive is its filesystem, programs
          run in the run times it reports, and your sign-in is this server's own
          account. <strong>Studio</strong> runs ad hoc code and{' '}
          <strong>Apps</strong> lists everything published here that you can
          open.
        </Typography>
      )}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {previousSignIn
          ? `You last signed in here ${previousSignIn}.`
          : 'This is your first sign-in on this browser.'}
      </Typography>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, md: 6 }} sx={{ minWidth: 0 }}>
          <Card variant="outlined" sx={{ height: '100%', overflow: 'hidden' }}>
            <CardHeader
              title="This instance"
              titleTypographyProps={{ variant: 'subtitle1' }}
            />
            <CardContent sx={{ pt: 0 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <Fact label="Mode">{appContext.mode}</Fact>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Fact label="Served by">
                    {host === 'browser'
                      ? 'A service worker in this page'
                      : 'The server process'}
                  </Fact>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Fact label="Run times">{runTimes}</Fact>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Fact label="Version">{appContext.version || 'dev'}</Fact>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Fact label="Apps in reach">
                    {appsAvailable === null ? '-' : appsAvailable}
                  </Fact>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Fact label={`Files in /home/${username}`}>
                    {filesInHome === null ? '-' : filesInHome}
                  </Fact>
                </Grid>
              </Grid>
              <Divider sx={{ my: 1.5 }} />
              <Stack
                direction="row"
                spacing={0.5}
                useFlexGap
                sx={{ flexWrap: 'wrap', maxWidth: '100%' }}
              >
                {appContext.isAdmin && (
                  <Chip size="small" label="Administrator" />
                )}
                {appContext.authProviders.length > 0 && (
                  <Chip
                    size="small"
                    label={appContext.authProviders.join(', ')}
                  />
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }} sx={{ minWidth: 0 }}>
          <Card variant="outlined" sx={{ height: '100%', overflow: 'hidden' }}>
            <CardHeader
              title="Recently used apps"
              titleTypographyProps={{ variant: 'subtitle1' }}
            />
            <CardContent sx={{ pt: 0 }}>
              {apps.length ? (
                <Grid container spacing={1}>
                  {apps.map((app) => (
                    <Grid
                      size={{ xs: 4 }}
                      key={app.href ?? app.to ?? app.title}
                      sx={{ minWidth: 0 }}
                    >
                      <AppTile
                        title={app.title}
                        logo={app.logo}
                        to={app.to}
                        href={app.href}
                        compact
                      />
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Apps you open appear here.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card variant="outlined" sx={{ mb: 2, overflow: 'hidden' }}>
        <CardHeader
          title="Recently opened files"
          titleTypographyProps={{ variant: 'subtitle1' }}
        />
        <CardContent sx={{ pt: 0 }}>
          {files.length ? (
            <List dense disablePadding sx={{ maxWidth: '100%' }}>
              {files.map((file) => (
                <ListItemButton
                  key={file.path}
                  component={Link}
                  to={`/SASjsStudio?filePath=${encodeURIComponent(file.path)}`}
                  sx={{ borderRadius: 1, minWidth: 0 }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <InsertDriveFileOutlined fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={file.path}
                    secondary={describeWhen(file.at)}
                    slotProps={{
                      primary: {
                        variant: 'body2',
                        noWrap: true,
                        title: file.path
                      }
                    }}
                  />
                </ListItemButton>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Files you open in Studio appear here.
            </Typography>
          )}
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button
          component={Link}
          to="/SASjsApps"
          size="small"
          variant="outlined"
        >
          Browse all apps
        </Button>
        {apps.length + files.length > 0 && (
          <Button
            size="small"
            startIcon={<DeleteSweep />}
            onClick={clearHistory}
            aria-label="Clear this browser's dashboard history"
          >
            Clear history
          </Button>
        )}
      </Box>
    </Box>
  )
}

export default Home
