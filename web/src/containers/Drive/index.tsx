import React, { useState } from 'react'

import CssBaseline from '@mui/material/CssBaseline'
import Box from '@mui/material/Box'

import SideBar from './sideBar'
import Main from './main'

const Drive = () => {
  const [selectedFilePath, setSelectedFilePath] = useState('')
  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <SideBar setSelectedFilePath={setSelectedFilePath} />
      <Main selectedFilePath={selectedFilePath} />
    </Box>
  )
}

export default Drive
