import React from 'react'
import { Route, HashRouter, Switch } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import { theme } from './theme'

import Header from './components/header'
import Home from './components/home'
import Drive from './containers/Drive'
import Studio from './containers/Studio'
function App() {
  return (
    <ThemeProvider theme={theme}>
      <HashRouter>
        <Header />
        <Switch>
          <Route exact path="/">
            <Home />
          </Route>
          <Route exact path="/SASjsDrive">
            <Drive />
          </Route>
          <Route exact path="/SASjsStudio">
            <Studio />
          </Route>
        </Switch>
      </HashRouter>
    </ThemeProvider>
  )
}

export default App
