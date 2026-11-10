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
  Paper,
  Stack,
  Typography
} from '@mui/material'
import {
  Api as ApiIcon,
  Apps as AppsIcon,
  ArrowForward,
  Code as CodeIcon,
  DeleteSweep,
  InfoOutlined,
  InsertDriveFileOutlined,
  MenuBook as MenuBookIcon,
  ScheduleOutlined
} from '@mui/icons-material'

import AppTile from '../../components/appTile'
import { AppContext } from '../../context/appContext'
import { brand } from '../../theme/palette'
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

/** \"today at 14:05\", \"yesterday at 09:12\", or the date - never a bare ISO stamp. */
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

/** White for the copy on the brand's black panel, at the weights the panel uses. */
const onDark = {
  strong: '#FFFFFF',
  body: 'rgba(255, 255, 255, 0.86)',
  faint: 'rgba(255, 255, 255, 0.62)',
  line: 'rgba(255, 255, 255, 0.16)'
}

/** One label/value row in the hero's instance panel. */
const HeroRow = (props: { label: string; value: string }) => (
  <Stack
    direction="row"
    spacing={2}
    sx={{
      alignItems: 'baseline',
      justifyContent: 'space-between',
      minWidth: 0
    }}
  >
    <Typography
      variant="caption"
      sx={{ color: onDark.faint, whiteSpace: 'nowrap' }}
    >
      {props.label}
    </Typography>
    <Typography
      variant="body2"
      noWrap
      title={props.value}
      sx={{
        color: onDark.strong,
        fontWeight: 500,
        textAlign: 'right',
        minWidth: 0
      }}
    >
      {props.value}
    </Typography>
  </Stack>
)

/** One of the two counts the instance panel leads with. */
const HeroStat = (props: { label: string; value: number | null }) => (
  <Box sx={{ minWidth: 0 }}>
    <Typography
      variant="h5"
      sx={{ color: onDark.strong, fontWeight: 600, lineHeight: 1.1 }}
    >
      {props.value === null ? '-' : props.value}
    </Typography>
    <Typography
      variant="caption"
      title={props.label}
      sx={{
        color: onDark.faint,
        display: 'block',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }}
    >
      {props.label}
    </Typography>
  </Box>
)

/**
 * What a screen holds, before the reader has to open it.
 *
 * A list rather than four copies of one card: the four destinations are the
 * product, and a reader who can see all four answers "what is this thing" from
 * the landing page instead of from the navigation.
 */
const destinations = [
  {
    title: 'Studio',
    description:
      'Run SAS code and read the log, the listing and the webout it produces.',
    to: '/studio',
    Icon: CodeIcon,
    needsStudio: true
  },
  {
    title: 'Apps',
    description:
      'The applications published on this instance, ready to open or share.',
    to: '/apps',
    Icon: AppsIcon,
    needsAppStream: true
  },
  {
    title: 'API',
    description:
      'Every REST endpoint this host answers, with the schema of each call.',
    to: '/api',
    Icon: ApiIcon
  },
  {
    title: 'Docs',
    description:
      'Install, authenticate, deploy a build, and read the drive reference.',
    to: '/docs',
    Icon: MenuBookIcon
  }
]

/** A destination card: the icon, the name, and one line of what it is for. */
const DestinationCard = (props: {
  title: string
  description: string
  to: string
  Icon: typeof CodeIcon
}) => {
  const { title, description, to, Icon } = props

  return (
    <Box
      component={Link}
      to={to}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        height: '100%',
        p: 2,
        borderRadius: 3,
        border: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        color: 'inherit',
        textDecoration: 'none',
        transition: 'border-color 120ms, box-shadow 120ms, transform 120ms',
        '&:hover': {
          borderColor: 'text.primary',
          boxShadow: 4,
          transform: 'translateY(-2px)'
        },
        '&:hover .destination-arrow': { transform: 'translateX(3px)' }
      }}
    >
      <Stack direction="row" sx={{ alignItems: 'center' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: 2,
            bgcolor: 'action.hover',
            color: 'text.primary'
          }}
        >
          <Icon fontSize="small" />
        </Box>
        <Box sx={{ flexGrow: 1 }} />
        <ArrowForward
          className="destination-arrow"
          fontSize="small"
          sx={{
            color: 'text.secondary',
            transition: 'transform 120ms'
          }}
        />
      </Stack>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </Box>
    </Box>
  )
}

/** What a list card says before anything has been put in it. */
const EmptyState = (props: {
  icon: React.ReactNode
  text: string
  action?: React.ReactNode
}) => (
  <Stack
    spacing={1.5}
    sx={{ alignItems: 'center', py: 3, textAlign: 'center' }}
  >
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 48,
        height: 48,
        borderRadius: '50%',
        bgcolor: 'action.hover',
        color: 'text.secondary'
      }}
    >
      {props.icon}
    </Box>
    <Typography variant="body2" color="text.secondary">
      {props.text}
    </Typography>
    {props.action}
  </Stack>
)

/**
 * The dashboard: what this instance is, who you are, and what you were doing.
 *
 * Apps live on their own tab - a grid that grows with the deployment belongs on
 * a screen of its own - so the landing page answers the questions a returning
 * reader actually has: what am I looking at, what can it do, where was I, and
 * what is on this server. The two lists are this browser's memory of this
 * user, per username, and they are clearable: a shared browser is a normal way
 * to use this app.
 *
 * The page opens on the brand's black panel rather than on a line of small
 * grey prose: the product's name, one sentence of what it does and the two
 * things a reader can do with it, with the instance's own facts beside them.
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
  // single value written at login would always read \"now\".
  const previousSignIn = signIns[1] ? describeWhen(signIns[1]) : ''

  const canUseAppStream = appContext.isAuthorizedFor(APP_STREAM_ROUTE)
  const canUseStudio = appContext.isAuthorizedFor(STUDIO_ROUTE)

  /** Where this page's API answers come from - the host states it. */
  const [host] = useState<ApiHost>(apiHost)

  useEffect(() => {
    // The count is of apps PUBLISHED to this deployment. Studio and the API
    // explorer are tabs in the header on every screen, not entries in this
    // list, so counting them here would advertise something the Apps tab no
    // longer shows.
    if (!canUseAppStream) {
      setAppsAvailable(0)
      return
    }

    let cancelled = false

    axios
      // The canonical spelling, not the short alias: the browser-hosted build
      // ships a service worker that answers /AppStream and /SASjsApi (the CLI's
      // mock host), and this request has to reach it there as well as here.
      .get('/AppStream/apps.json')
      .then((res) => {
        if (cancelled) return
        setAppsAvailable(
          Array.isArray(res.data?.apps) ? res.data.apps.length : 0
        )
      })
      .catch(() => {
        if (!cancelled) setAppsAvailable(0)
      })

    return () => {
      cancelled = true
    }
  }, [canUseAppStream])

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

  const hostName =
    host === 'browser' ? 'A service worker in this page' : 'The server process'

  const visibleDestinations = destinations.filter(
    (destination) =>
      (!destination.needsStudio || canUseStudio) &&
      (!destination.needsAppStream || canUseAppStream)
  )

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 1200,
        mx: 'auto',
        px: { xs: 2, md: 3 },
        py: 3,
        mt: '50px'
      }}
    >
      <Paper
        elevation={0}
        sx={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 4,
          mb: 2.5,
          p: { xs: 2, sm: 3, md: 4 },
          color: onDark.strong,
          bgcolor: brand.black,
          border: 1,
          borderColor: 'divider'
        }}
      >
        {/* The brand's yellow, as light falling across the panel rather than
            as a second surface: the logo and the accent are the only yellow,
            so the panel stays black-and-white with one warm corner. */}
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background:
              'radial-gradient(120% 120% at 0% 0%, rgba(246, 227, 15, 0.16) 0%, rgba(246, 227, 15, 0) 55%)'
          }}
        />

        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={{ xs: 3, md: 4 }}
          sx={{ position: 'relative' }}
        >
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Stack
              direction="row"
              spacing={1.5}
              sx={{ alignItems: 'center', mb: 2 }}
            >
              <img
                src="/logo.png"
                alt=""
                width={44}
                height={44}
                style={{ display: 'block' }}
              />
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="overline"
                  component="div"
                  sx={{
                    color: brand.yellow,
                    fontWeight: 700,
                    letterSpacing: '0.18em',
                    lineHeight: 1.2,
                    display: 'block'
                  }}
                >
                  SASjs Server
                </Typography>
                <Typography
                  variant="caption"
                  component="div"
                  sx={{ color: onDark.faint }}
                >
                  A visual interface and REST API for SAS
                </Typography>
              </Box>
              {host === 'browser' && (
                <Chip
                  size="small"
                  label="Demo"
                  sx={{
                    ml: 0.5,
                    bgcolor: brand.yellow,
                    color: brand.black,
                    fontWeight: 700,
                    letterSpacing: '0.06em'
                  }}
                />
              )}
            </Stack>

            <Typography
              variant="h3"
              sx={{
                fontSize: { xs: '1.75rem', sm: '2.1rem', md: '2.5rem' },
                fontWeight: 600,
                lineHeight: 1.15,
                letterSpacing: '-0.02em',
                mb: 1.5
              }}
            >
              Welcome
              {appContext.displayName ? `, ${appContext.displayName}` : ''}
            </Typography>

            <Typography
              variant="body1"
              sx={{
                color: onDark.body,
                fontSize: '1.0625rem',
                lineHeight: 1.6,
                maxWidth: 620,
                mb: { xs: 2, md: 3 }
              }}
            >
              Run SAS programs, call every endpoint through a documented API,
              and host the applications built on both - from one interface, on
              this instance.
            </Typography>

            <Stack
              direction="row"
              spacing={1.5}
              useFlexGap
              sx={{ flexWrap: 'wrap' }}
            >
              {canUseStudio && (
                <Button
                  component={Link}
                  to="/studio"
                  variant="contained"
                  color="secondary"
                  size="large"
                  startIcon={<CodeIcon />}
                  sx={{ color: brand.black, fontWeight: 600 }}
                >
                  Open Studio
                </Button>
              )}
              {canUseAppStream && (
                <Button
                  component={Link}
                  to="/apps"
                  variant={canUseStudio ? 'outlined' : 'contained'}
                  color={canUseStudio ? 'inherit' : 'secondary'}
                  size="large"
                  startIcon={<AppsIcon />}
                  sx={{
                    fontWeight: 600,
                    color: canUseStudio ? onDark.strong : brand.black,
                    borderColor: canUseStudio
                      ? 'rgba(255, 255, 255, 0.45)'
                      : undefined,
                    '&:hover': {
                      borderColor: onDark.strong,
                      bgcolor: 'rgba(255, 255, 255, 0.08)'
                    }
                  }}
                >
                  Browse apps
                </Button>
              )}
            </Stack>
          </Box>

          <Box
            sx={{
              width: { xs: '100%', md: 340 },
              flexShrink: 0,
              alignSelf: { xs: 'auto', md: 'flex-start' },
              p: 2,
              borderRadius: 3,
              border: 1,
              borderColor: onDark.line,
              bgcolor: 'rgba(255, 255, 255, 0.05)'
            }}
          >
            <Typography
              variant="overline"
              component="div"
              sx={{ color: onDark.faint, letterSpacing: '0.14em' }}
            >
              This instance
            </Typography>

            <Stack spacing={1} sx={{ mt: 1.5 }}>
              <HeroRow label="Mode" value={String(appContext.mode)} />
              <HeroRow label="Served by" value={hostName} />
              <HeroRow label="Run times" value={runTimes} />
              <HeroRow
                label="Version"
                value={appContext.version || 'development build'}
              />
            </Stack>

            <Divider sx={{ my: 1.5, borderColor: onDark.line }} />

            <Stack direction="row" spacing={2}>
              <HeroStat label="Apps published" value={appsAvailable} />
              <HeroStat
                label={`Files in /home/${username}`}
                value={filesInHome}
              />
            </Stack>

            {(appContext.isAdmin || appContext.authProviders.length > 0) && (
              <Stack
                direction="row"
                spacing={0.5}
                useFlexGap
                sx={{ flexWrap: 'wrap', mt: 1.5 }}
              >
                {appContext.isAdmin && (
                  <Chip
                    size="small"
                    label="Administrator"
                    variant="outlined"
                    sx={{
                      color: onDark.strong,
                      borderColor: onDark.line
                    }}
                  />
                )}
                {appContext.authProviders.length > 0 && (
                  <Chip
                    size="small"
                    label={appContext.authProviders.join(', ')}
                    variant="outlined"
                    sx={{
                      color: onDark.strong,
                      borderColor: onDark.line
                    }}
                  />
                )}
              </Stack>
            )}
          </Box>
        </Stack>
      </Paper>

      <Paper
        variant="outlined"
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 2,
          p: { xs: 2, md: 2.5 },
          mb: 3,
          borderRadius: 3,
          bgcolor: 'background.paper'
        }}
      >
        <InfoOutlined
          sx={{ color: 'text.secondary', mt: 0.25, flexShrink: 0 }}
        />
        <Box sx={{ minWidth: 0 }}>
          {host === 'browser' ? (
            <>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 600, lineHeight: 1.4, mb: 0.5 }}
              >
                You are looking at SASjs Server running in this browser - there
                is no server behind this page.
              </Typography>
              <Typography variant="body1" color="text.secondary">
                A service worker answers every API call, the drive is a snapshot
                built into the site, the programs that run are JavaScript, and
                the sign-in is a seeded demo identity. Every screen here - this
                dashboard, <strong>Studio</strong>, the API explorer,{' '}
                <strong>Docs</strong> and the apps - is the real interface,
                running against a host of its own. Open <strong>Studio</strong>{' '}
                and press Run to watch a program execute against a recorded SAS
                session.
              </Typography>
            </>
          ) : (
            <>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 600, lineHeight: 1.4, mb: 0.5 }}
              >
                You are talking to SASjs Server on this host.
              </Typography>
              <Typography variant="body1" color="text.secondary">
                The API answers from the server process, the drive is its
                filesystem, programs run in the run times it reports, and your
                sign-in is this server's own account. <strong>Studio</strong>{' '}
                runs ad hoc code and <strong>Apps</strong> lists everything
                published here that you can open.
              </Typography>
            </>
          )}
          <Stack
            direction="row"
            spacing={0.75}
            sx={{ alignItems: 'center', mt: 1.5 }}
          >
            <ScheduleOutlined
              fontSize="small"
              sx={{ color: 'text.secondary' }}
            />
            <Typography variant="body2" color="text.secondary">
              {previousSignIn
                ? `You last signed in here ${previousSignIn}.`
                : 'This is your first sign-in on this browser.'}
            </Typography>
          </Stack>
        </Box>
      </Paper>

      <Box sx={{ mb: 1.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          What you can do here
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Every screen below is this server's own interface, not a preview of
          one.
        </Typography>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {visibleDestinations.map((destination) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={destination.to}>
            <DestinationCard
              title={destination.title}
              description={destination.description}
              to={destination.to}
              Icon={destination.Icon}
            />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }} sx={{ minWidth: 0 }}>
          <Card variant="outlined" sx={{ height: '100%', overflow: 'hidden' }}>
            <CardHeader
              title="Recently used apps"
              titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
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
                <EmptyState
                  icon={<AppsIcon />}
                  text="Apps you open appear here."
                  action={
                    canUseAppStream ? (
                      <Button
                        component={Link}
                        to="/apps"
                        size="small"
                        variant="outlined"
                      >
                        Browse apps
                      </Button>
                    ) : undefined
                  }
                />
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }} sx={{ minWidth: 0 }}>
          <Card variant="outlined" sx={{ height: '100%', overflow: 'hidden' }}>
            <CardHeader
              title="Recently opened files"
              titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
            />
            <CardContent sx={{ pt: 0 }}>
              {files.length ? (
                <List dense disablePadding sx={{ maxWidth: '100%' }}>
                  {files.map((file) => (
                    <ListItemButton
                      key={file.path}
                      component={Link}
                      to={`/studio?filePath=${encodeURIComponent(file.path)}`}
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
                <EmptyState
                  icon={<InsertDriveFileOutlined />}
                  text="Files you open in Studio appear here."
                  action={
                    canUseStudio ? (
                      <Button
                        component={Link}
                        to="/studio"
                        size="small"
                        variant="outlined"
                      >
                        Open Studio
                      </Button>
                    ) : undefined
                  }
                />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {apps.length + files.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            size="small"
            startIcon={<DeleteSweep />}
            onClick={clearHistory}
            aria-label="Clear this browser's dashboard history"
          >
            Clear this browser's history
          </Button>
        </Box>
      )}
    </Box>
  )
}

export default Home
