import React from 'react'
import { Route, BrowserRouter, Switch, Redirect } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import { theme } from './theme'

import Header from './components/header'
import Home from './components/home'
import SASjsDrive from './containers/SASjsDrive'
import SASStudio from './containers/SASjsStudio'
function App() {
  return (
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <Header />
        <Switch>
          <Route exact path="/">
            <Home />
          </Route>
          <Route exact path="/SASjsDrive">
            <SASjsDrive />
          </Route>
          <Route exact path="/SASjsStudio">
            <SASStudio />
          </Route>
        </Switch>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
