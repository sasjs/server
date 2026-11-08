import { useContext, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Grid,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography
} from '@mui/material'
import {
  DeleteSweep,
  InsertDriveFileOutlined,
  RestoreFromTrash
} from '@mui/icons-material'

import AppTile from '../../components/appTile'
import { AppContext } from '../../context/appContext'
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

  if (days < 0) return `today at ${time}`
  if (days === 0) return `yesterday at ${time}`
  if (days === 1) return `yesterday at ${time}`

  return then.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: then.getFullYear() === today.getFullYear() ? undefined : 'numeric'
  })
}

/**
 * The dashboard: who you are, when you were last here, and what you were doing.
 *
 * Apps live on their own tab now - a grid that grows with the deployment belongs
 * on a screen of its own - so the landing page answers the question a returning
 * reader actually has: where was I? The two lists are this browser's memory of
 * this user, per username, and they are clearable: a shared browser is a normal
 * way to use this app.
 */
const Home = () => {
  const appContext = useContext(AppContext)
  const username = appContext.username

  const [historyVersion, setHistoryVersion] = useState(0)

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

  const clearHistory = () => {
    clearDashboardHistory(username)
    setHistoryVersion((version) => version + 1)
  }

  return (
    <Box className="container" sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Welcome{appContext.displayName ? `, ${appContext.displayName}` : ''}
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {previousSignIn
          ? `You last signed in on this browser ${previousSignIn}.`
          : 'This is your first sign-in on this browser.'}
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
        <Tooltip title="Clear this browser's dashboard history">
          <IconButton
            size="small"
            onClick={clearHistory}
            aria-label="Clear this browser's dashboard history"
          >
            <DeleteSweep fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined">
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

        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined">
            <CardHeader
              title="Recently opened files"
              titleTypographyProps={{ variant: 'subtitle1' }}
            />
            <CardContent sx={{ pt: 0 }}>
              {files.length ? (
                <List dense disablePadding>
                  {files.map((file) => (
                    <ListItemButton
                      key={file.path}
                      component={Link}
                      to={`/SASjsStudio?filePath=${encodeURIComponent(file.path)}`}
                      sx={{ borderRadius: 1 }}
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
        </Grid>
      </Grid>

      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
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
            startIcon={<RestoreFromTrash />}
            onClick={clearHistory}
          >
            Clear history
          </Button>
        )}
      </Box>
    </Box>
  )
}

export default Home
