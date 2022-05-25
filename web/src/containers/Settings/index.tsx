import * as React from 'react'

import { Box, Paper, Tab, styled } from '@mui/material'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'

import Profile from './profile'

const StyledTab = styled(Tab)({
  background: 'black',
  margin: '0 5px 5px 0'
})

const StyledTabpanel = styled(TabPanel)({
  flexGrow: 1
})

const Settings = () => {
  const [value, setValue] = React.useState('profile')

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue)
  }

  return (
    <Box
      sx={{
        display: 'flex',
        marginTop: '65px'
      }}
    >
      <TabContext value={value}>
        <Box component={Paper} sx={{ margin: '0 5px', height: '92vh' }}>
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
          </TabList>
        </Box>
        <StyledTabpanel value="profile">
          <Profile />
        </StyledTabpanel>
      </TabContext>
    </Box>
  )
}

export default Settings
