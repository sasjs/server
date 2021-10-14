import React from 'react'

import { ThemeProvider } from '@mui/material/styles'
import { theme } from './theme'

import SASjsDrive from './containers/SASjsDrive'

function App() {
  return (
    <ThemeProvider theme={theme}>
      <SASjsDrive />
    </ThemeProvider>
  )
}

export default App
