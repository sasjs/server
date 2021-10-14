import React, { useState } from 'react'

import CssBaseline from '@mui/material/CssBaseline'
import Box from '@mui/material/Box'

import Header from '../../components/header'
import SideBar from './sideBar'
import Main from './main'

const SASjsDrive = () => {
  const [selectedFilePath, setSelectedFilePath] = useState('')
  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <Header title="SASjs Drive" />
      <SideBar setSelectedFilePath={setSelectedFilePath} />
      <Main selectedFilePath={selectedFilePath} />
    </Box>
  )
}

export default SASjsDrive
