import React, { useState } from 'react'
import { Link, useHistory, useLocation } from 'react-router-dom'

import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Button from '@mui/material/Button'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'

const NODE_ENV = process.env.NODE_ENV
const PORT_API = process.env.PORT_API
const baseUrl =
  NODE_ENV === 'development' ? `http://localhost:${PORT_API ?? 5000}` : ''

const Header = (props: any) => {
  const history = useHistory()
  const { pathname } = useLocation()
  const [tabValue, setTabValue] = useState(pathname)

  const handleTabChange = (event: React.SyntheticEvent, value: string) => {
    setTabValue(value)
  }
  return (
    <AppBar
      position="fixed"
      sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
    >
      <Toolbar variant="dense">
        <img
          src="logo-white.png"
          alt="logo"
          style={{
            width: '50px',
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
          startIcon={<OpenInNewIcon />}
          style={{ marginLeft: '50px' }}
        >
          API Docs
        </Button>
      </Toolbar>
    </AppBar>
  )
}

export default Header
