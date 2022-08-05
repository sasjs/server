import React, { useState, useContext } from 'react'

import { Box, Paper, Tab, styled } from '@mui/material'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'

import Permission from './permission'
import Profile from './profile'

import { AppContext, ModeType } from '../../context/appContext'

const StyledTab = styled(Tab)({
  background: 'black',
  margin: '0 5px 5px 0'
})

const StyledTabpanel = styled(TabPanel)({
  flexGrow: 1
})

const Settings = () => {
  const appContext = useContext(AppContext)
  const [value, setValue] = useState('profile')

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue)
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        marginTop: '65px'
      }}
    >
      <TabContext value={value}>
        <Box
          component={Paper}
          sx={{
            margin: '0 5px',
            height: { md: '92vh' },
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          <TabList
            TabIndicatorProps={{
              style: {
                display: 'none'
              }
            }}
            orientation="vertical"
            onChange={handleChange}
          >
            <StyledTab label="Profile" value="profile" />
            {appContext.mode === ModeType.Server && (
              <StyledTab label="Permissions" value="permission" />
            )}
          </TabList>
        </Box>
        <StyledTabpanel value="profile">
          <Profile />
        </StyledTabpanel>
        <StyledTabpanel value="permission">
          <Permission />
        </StyledTabpanel>
      </TabContext>
    </Box>
  )
}

export default Settings
