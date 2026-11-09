import React, { useState, useEffect, useContext } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'

import {
  Box,
  AppBar,
  Toolbar,
  Tabs,
  Tab,
  Button,
  Menu,
  MenuItem,
  IconButton,
  Typography
} from '@mui/material'
import {
  DarkMode,
  GitHub,
  LightMode,
  Menu as MenuIcon,
  OpenInNew,
  Settings
} from '@mui/icons-material'

import Username from './username'
import Search from './search'
import { AppContext } from '../context/appContext'
import { STUDIO_ROUTE } from '../utils'
import { oppositePreference } from '../utils/colorScheme'
import { useColorMode } from '../utils/hooks'

// Every route that has a tab. A path missing here still renders its screen -
// /settings and the legacy paths are screens without a tab - but nothing is
// underlined for it, which is why this list and the Tabs below move together.
const validTabs = ['/', '/apps', '/studio', '/api']

/**
 * The tab a path belongs to.
 *
 * The docs are a screen with pages under it - /docs/guides/settings/ - so the
 * whole subtree is one tab; everything else is a path of its own.
 */
const tabFor = (pathname: string) => {
  if (pathname === '/docs' || pathname.startsWith('/docs/')) return '/docs'

  return validTabs.includes(pathname) ? pathname : ''
}

const Header = (props: any) => {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const appContext = useContext(AppContext)
  const [tabValue, setTabValue] = useState(tabFor(pathname))

  const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(null)
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(
    null
  )

  // Running ad hoc code is permissioned, so the editor is offered only to a
  // caller the server admits. App.tsx guards the route as well: hiding the tab
  // alone would leave the URL as a way in.
  // The switch flips an explicit choice, so it writes `light` or `dark` rather
  // than toggling `system`: pressing it twice returns to where it started,
  // whatever the OS is doing.
  const [colorMode, setColorMode] = useColorMode()
  const nextMode = oppositePreference(colorMode)

  const canUseStudio = appContext.isAuthorizedFor(STUDIO_ROUTE)

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget)
  }
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget)
  }

  const handleCloseNavMenu = () => {
    setAnchorElNav(null)
  }

  const handleCloseUserMenu = () => {
    setAnchorElUser(null)
  }

  useEffect(() => {
    setTabValue(tabFor(pathname))
  }, [pathname])

  const handleTabChange = (event: React.SyntheticEvent, value: string) => {
    setTabValue(value)
  }

  const handleLogout = () => {
    if (appContext.logout) {
      handleCloseUserMenu()
      appContext.logout()
    }
  }
  return (
    <AppBar
      position="fixed"
      sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
    >
      <Toolbar variant="dense">
        <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
          <img
            src="/logo.png"
            alt="logo"
            style={{
              width: '35px',
              height: '35px',
              marginTop: '9px',
              cursor: 'pointer',
              marginRight: '25px'
            }}
            onClick={() => {
              setTabValue('/')
              navigate('/')
            }}
          />
          <Tabs
            indicatorColor="secondary"
            value={tabValue}
            onChange={handleTabChange}
          >
            <Tab label="Home" value="/" to="/" component={Link} />
            <Tab label="Apps" value="/apps" to="/apps" component={Link} />
            {canUseStudio && (
              <Tab
                label="Studio"
                value="/studio"
                to="/studio"
                component={Link}
              />
            )}
            {/* Screens of the app like the rest: each frames a page of its
                own, which is why the address bar can carry the page being read
                inside them. */}
            <Tab
              label="API"
              value="/api"
              to="/api"
              component={Link}
              sx={{ borderRadius: 0 }}
            />
            <Tab label="Docs" value="/docs" to="/docs" component={Link} />
          </Tabs>
        </Box>

        <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
          <IconButton
            size="large"
            onClick={handleOpenNavMenu}
            color="inherit"
            aria-label="Open the navigation menu"
          >
            <MenuIcon />
          </IconButton>

          <Menu
            id="menu-appbar"
            anchorEl={anchorElNav}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left'
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left'
            }}
            open={!!anchorElNav}
            onClose={handleCloseNavMenu}
            sx={{
              display: { xs: 'block', md: 'none' }
            }}
          >
            <MenuItem sx={{ justifyContent: 'center' }}>
              <Button
                component={Link}
                to="/"
                onClick={handleCloseNavMenu}
                variant="contained"
                color="primary"
              >
                Home
              </Button>
            </MenuItem>

            <MenuItem sx={{ justifyContent: 'center' }}>
              <Button
                component={Link}
                to="/apps"
                onClick={handleCloseNavMenu}
                variant="contained"
                color="primary"
              >
                Apps
              </Button>
            </MenuItem>

            {canUseStudio && (
              <MenuItem sx={{ justifyContent: 'center' }}>
                <Button
                  component={Link}
                  to="/studio"
                  onClick={handleCloseNavMenu}
                  variant="contained"
                  color="primary"
                >
                  Studio
                </Button>
              </MenuItem>
            )}

            <MenuItem sx={{ justifyContent: 'center' }}>
              <Button
                component="a"
                href="/api"
                onClick={handleCloseNavMenu}
                variant="contained"
                color="primary"
              >
                API
              </Button>
            </MenuItem>

            <MenuItem sx={{ justifyContent: 'center' }}>
              <Button
                component="a"
                href="/docs"
                onClick={handleCloseNavMenu}
                variant="contained"
                color="primary"
              >
                Docs
              </Button>
            </MenuItem>
          </Menu>
        </Box>

        <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
          <img
            src="/logo.png"
            alt="logo"
            style={{
              width: '35px',
              height: '35px',
              marginTop: '2px',
              cursor: 'pointer',
              marginRight: '25px'
            }}
            onClick={() => {
              setTabValue('/')
              navigate('/')
            }}
          />
        </Box>

        <div
          style={{
            display: 'flex',
            flexGrow: 1,
            justifyContent: 'flex-end'
          }}
        >
          {/* The icons sit before the search box: they are the same on every
              screen and never move, while the field grows and shrinks with the
              window - a control that shifts position is one a reader has to hunt
              for. */}
          <IconButton
            color="inherit"
            href="https://github.com/sasjs/server"
            target="_blank"
            rel="noreferrer"
            aria-label="The SASjs server repository on GitHub"
            title="The SASjs server repository on GitHub"
          >
            <GitHub fontSize="small" />
          </IconButton>
          <IconButton
            color="inherit"
            onClick={() => setColorMode(nextMode)}
            aria-label={`Switch to the ${nextMode} theme`}
            title={`Switch to the ${nextMode} theme`}
          >
            {colorMode === 'dark' ? <LightMode /> : <DarkMode />}
          </IconButton>
          {/* Nothing to search from a screen the reader has not reached yet,
              and a field that cannot answer is one more thing between them and
              the sign-in form. */}
          {appContext.loggedIn && <Search />}
          <Username
            username={appContext.displayName || appContext.username}
            onClickHandler={handleOpenUserMenu}
          />
          <Menu
            id="menu-appbar"
            anchorEl={anchorElUser}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'center'
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'center'
            }}
            open={!!anchorElUser}
            onClose={handleCloseUserMenu}
          >
            {appContext.loggedIn && (
              <MenuItem
                sx={{ justifyContent: 'center', display: { md: 'none' } }}
              >
                <Typography
                  variant="h5"
                  sx={{ border: '1px solid black', padding: '5px' }}
                >
                  {appContext.displayName || appContext.username}
                </Typography>
              </MenuItem>
            )}

            <MenuItem sx={{ justifyContent: 'center' }}>
              <Button
                component={Link}
                to="/settings"
                onClick={handleCloseUserMenu}
                variant="contained"
                color="primary"
                startIcon={<Settings />}
              >
                Settings
              </Button>
            </MenuItem>
            <MenuItem sx={{ justifyContent: 'center' }}>
              <Button
                href={'https://server.sasjs.io'}
                target="_blank"
                rel="noreferrer"
                variant="contained"
                size="large"
                color="primary"
                endIcon={<OpenInNew />}
              >
                Docs
              </Button>
            </MenuItem>
            {appContext.loggedIn && (
              <MenuItem
                onClick={handleLogout}
                sx={{ justifyContent: 'center' }}
              >
                <Button variant="contained" color="primary">
                  Logout
                </Button>
              </MenuItem>
            )}
          </Menu>
        </div>
      </Toolbar>
    </AppBar>
  )
}

export default Header
