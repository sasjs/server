import React, { useState, useContext } from 'react'
import { Link, useHistory, useLocation } from 'react-router-dom'

import {
  AppBar,
  Toolbar,
  Tabs,
  Tab,
  Button,
  Menu,
  MenuItem
} from '@mui/material'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'

import Username from './username'
import { AppContext } from '../context/appContext'

const NODE_ENV = process.env.NODE_ENV
const PORT_API = process.env.PORT_API
const baseUrl =
  NODE_ENV === 'development' ? `http://localhost:${PORT_API ?? 5000}` : ''

const Header = (props: any) => {
  const history = useHistory()
  const { pathname } = useLocation()
  const appContext = useContext(AppContext)
  const [tabValue, setTabValue] = useState(
    pathname === '/SASjsLogon' ? '/' : pathname
  )
  const [anchorEl, setAnchorEl] = useState<
    (EventTarget & HTMLButtonElement) | null
  >(null)

  const handleMenu = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleTabChange = (event: React.SyntheticEvent, value: string) => {
    setTabValue(value)
  }

  const handleLogout = () => {
    if (appContext.logout) appContext.logout()
  }
  return (
    <AppBar
      position="fixed"
      sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
    >
      <Toolbar variant="dense">
        <img
          src="logo.png"
          alt="logo"
          style={{
            width: '35px',
            cursor: 'pointer',
            marginRight: '25px'
          }}
          onClick={() => {
            setTabValue('/')
            history.push('/')
          }}
        />
        <Tabs
          indicatorColor="secondary"
          value={tabValue}
          onChange={handleTabChange}
        >
          <Tab label="Home" value="/" to="/" component={Link} />
          <Tab
            label="Drive"
            value="/SASjsDrive"
            to="/SASjsDrive"
            component={Link}
          />
          <Tab
            label="Studio"
            value="/SASjsStudio"
            to="/SASjsStudio"
            component={Link}
          />
        </Tabs>
        <Button
          href={`${baseUrl}/SASjsApi`}
          target="_blank"
          rel="noreferrer"
          variant="contained"
          color="primary"
          size="large"
          endIcon={<OpenInNewIcon />}
        >
          API Docs
        </Button>
        <Button
          href={`${baseUrl}/AppStream`}
          target="_blank"
          rel="noreferrer"
          variant="contained"
          color="primary"
          size="large"
          endIcon={<OpenInNewIcon />}
        >
          App Stream
        </Button>
        <div
          style={{
            display: 'flex',
            flexGrow: 1,
            justifyContent: 'flex-end'
          }}
        >
          <Username
            username={appContext.displayName || appContext.username}
            onClickHandler={handleMenu}
          />
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'center'
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'center'
            }}
            open={!!anchorEl}
            onClose={handleClose}
          >
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
