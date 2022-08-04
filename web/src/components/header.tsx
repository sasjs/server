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
import { OpenInNew, Settings, Menu as MenuIcon } from '@mui/icons-material'

import Username from './username'
import { AppContext } from '../context/appContext'

const NODE_ENV = process.env.NODE_ENV
const PORT_API = process.env.PORT_API
const baseUrl =
  NODE_ENV === 'development' ? `http://localhost:${PORT_API ?? 5000}` : ''

const validTabs = ['/', '/SASjsDrive', '/SASjsStudio']

const Header = (props: any) => {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const appContext = useContext(AppContext)
  const [tabValue, setTabValue] = useState(
    validTabs.includes(pathname) ? pathname : '/'
  )

  const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(null)
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(
    null
  )

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
    setTabValue(validTabs.includes(pathname) ? pathname : '/')
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
            src="logo.png"
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
            <Tab
              label="Studio"
              value="/SASjsStudio"
              to="/SASjsStudio"
              component={Link}
            />
          </Tabs>
          <Button
            href={`${baseUrl}/AppStream`}
            target="_blank"
            rel="noreferrer"
            variant="contained"
            color="primary"
            size="large"
            endIcon={<OpenInNew />}
          >
            Apps
          </Button>
        </Box>

        <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
          <IconButton size="large" onClick={handleOpenNavMenu} color="inherit">
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
                to="/SASjsStudio"
                onClick={handleCloseNavMenu}
                variant="contained"
                color="primary"
              >
                Studio
              </Button>
            </MenuItem>

            <MenuItem sx={{ justifyContent: 'center' }}>
              <Button
                href={`${baseUrl}/AppStream`}
                target="_blank"
                rel="noreferrer"
                onClick={handleCloseNavMenu}
                variant="contained"
                color="primary"
                endIcon={<OpenInNew />}
              >
                Apps
              </Button>
            </MenuItem>
          </Menu>
        </Box>

        <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
          <img
            src="logo.png"
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
                to="/SASjsSettings"
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
            <MenuItem sx={{ justifyContent: 'center' }}>
              <Button
                href={`${baseUrl}/SASjsApi`}
                target="_blank"
                rel="noreferrer"
                variant="contained"
                color="primary"
                size="large"
                endIcon={<OpenInNew />}
              >
                API
              </Button>
            </MenuItem>
            <MenuItem onClick={handleLogout} sx={{ justifyContent: 'center' }}>
              <Button variant="contained" color="primary">
                Logout
              </Button>
            </MenuItem>
          </Menu>
        </div>
      </Toolbar>
    </AppBar>
  )
}

export default Header
