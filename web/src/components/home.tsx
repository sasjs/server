import { useContext, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import axios from 'axios'
import Box from '@mui/material/Box'
import CssBaseline from '@mui/material/CssBaseline'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import { OpenInNew, Settings } from '@mui/icons-material'

import { AppContext } from '../context/appContext'
import { APP_STREAM_ROUTE, STUDIO_ROUTE } from '../utils'

interface StreamedApp {
  name: string
  appLoc: string
  logo: string | null
  url: string
}

const defaultAppLogo = '/sasjs-logo.svg'

/**
 * One tile in the home screen's grid. Both the built-in screens and the
 * streamed apps use it, so the list reads as one set of things to open rather
 * than a menu plus a separate app list.
 */
const AppTile = (props: {
  title: string
  subtitle?: string
  logo?: string | null
  to?: string
  href?: string
}) => {
  const { title, subtitle, logo, to, href } = props

  const content = (
    <Paper
      elevation={3}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        height: 160,
        p: 2,
        textAlign: 'center',
        textDecoration: 'none',
        color: 'inherit',
        '&:hover': { boxShadow: 6 }
      }}
    >
      {logo && (
        <img
          src={logo}
          alt=""
          style={{ maxHeight: 64, maxWidth: '100%' }}
          onError={(e) => {
            const img = e.currentTarget
            if (img.src.endsWith(defaultAppLogo)) return
            img.src = defaultAppLogo
          }}
        />
      )}
      <Typography variant="subtitle1">{title}</Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Paper>
  )

  if (href)
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        style={{ textDecoration: 'none' }}
      >
        {content}
      </a>
    )

  return (
    <Link to={to ?? '/'} style={{ textDecoration: 'none' }}>
      {content}
    </Link>
  )
}

/**
 * The home screen is the list of things this caller can open: the built-in
 * screens first, then every app streamed to this deployment. The streamed list
 * comes from the server, already filtered to what the caller holds a grant on,
 * so a tile is never a dead end.
 */
const Home = () => {
  const appContext = useContext(AppContext)
  const [apps, setApps] = useState<StreamedApp[]>([])
  const [loadingApps, setLoadingApps] = useState(true)

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
              logo="/sasjs-logo.svg"
              to="/SASjsStudio"
            />
          </Grid>
        )}
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <AppTile
            title="API Explorer"
            subtitle="Browse the REST API"
            logo="/sasjs-logo.svg"
            href="/SASjsApi"
          />
        </Grid>
        {apps.map((app) => (
          <Grid size={{ xs: 6, sm: 4, md: 3 }} key={app.name}>
            <AppTile
              title={app.name}
              subtitle={app.appLoc}
              logo={app.logo ?? defaultAppLogo}
              href={app.url}
            />
          </Grid>
        ))}
      </Grid>

      {loadingApps && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <CircularProgress size={24} />
        </Box>
      )}

      <Box sx={{ mt: 4, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Settings fontSize="small" />
        <Typography variant="body2" color="text.secondary">
          Settings and the API documentation are in the account menu.
        </Typography>
        <OpenInNew fontSize="small" />
      </Box>
    </Box>
  )
}

export default Home
