import { useContext, useEffect, useState } from 'react'

import axios from 'axios'
import Box from '@mui/material/Box'
import CssBaseline from '@mui/material/CssBaseline'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

import AppTile from '../../components/appTile'
import { AppContext } from '../../context/appContext'
import { APP_STREAM_ROUTE, STUDIO_ROUTE } from '../../utils'
import { RecentApp, rememberRecentApp } from '../../utils/recent'

interface StreamedApp {
  name: string
  appLoc: string
  logo: string | null
  url: string
}

const defaultAppLogo = '/sasjs-logo.svg'

/**
 * Every app this caller can open: the built-in screens first, then every app
 * streamed to this deployment.
 *
 * The streamed list comes from the server, already filtered to what the caller
 * holds a grant on, so a tile is never a dead end. Opening one is recorded, which
 * is what the home dashboard's "recently used" row reads - recorded here rather
 * than in the dashboard so an app opened from anywhere is remembered.
 */
const Apps = () => {
  const appContext = useContext(AppContext)
  const [apps, setApps] = useState<StreamedApp[]>([])
  const [loadingApps, setLoadingApps] = useState(true)

  const username = appContext.username
  const canUseAppStream = appContext.isAuthorizedFor(APP_STREAM_ROUTE)
  const canUseStudio = appContext.isAuthorizedFor(STUDIO_ROUTE)

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

  const remember = (app: Omit<RecentApp, 'at'>) => () =>
    rememberRecentApp(username, app)

  return (
    <Box className="container" sx={{ p: 3 }}>
      <CssBaseline />
      <Typography variant="h5" sx={{ mb: 3 }}>
        Apps
      </Typography>
      <Grid container spacing={2}>
        {canUseStudio && (
          <Grid size={{ xs: 6, sm: 4, md: 3 }}>
            <AppTile
              title="Studio"
              subtitle="Run ad hoc code"
              logo={defaultAppLogo}
              to="/SASjsStudio"
              onOpen={remember({
                title: 'Studio',
                subtitle: 'Run ad hoc code',
                logo: defaultAppLogo,
                to: '/SASjsStudio'
              })}
            />
          </Grid>
        )}
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <AppTile
            title="API Explorer"
            subtitle="Browse the REST API"
            logo={defaultAppLogo}
            to="/SASjsApiDocs"
            onOpen={remember({
              title: 'API Explorer',
              subtitle: 'Browse the REST API',
              logo: defaultAppLogo,
              to: '/SASjsApiDocs'
            })}
          />
        </Grid>
        {apps.map((app) => (
          <Grid size={{ xs: 6, sm: 4, md: 3 }} key={app.name}>
            <AppTile
              title={app.name}
              subtitle={app.appLoc}
              logo={app.logo ?? defaultAppLogo}
              href={app.url}
              onOpen={remember({
                title: app.name,
                subtitle: app.appLoc,
                logo: app.logo ?? defaultAppLogo,
                href: app.url
              })}
            />
          </Grid>
        ))}
      </Grid>

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
