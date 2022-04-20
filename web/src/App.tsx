import React, { useContext } from 'react'
import { Route, HashRouter, Switch } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import { theme } from './theme'

import Login from './components/login'
import Header from './components/header'
import Home from './components/home'
import Drive from './containers/Drive'
import Studio from './containers/Studio'

import { AppContext } from './context/appContext'

function App() {
  const appContext = useContext(AppContext)

  if (!appContext.tokens) {
    return (
      <ThemeProvider theme={theme}>
        <HashRouter>
          <Header />
          <Switch>
            <Route exact path="/SASjsLogon">
              <Login getCodeOnly />
            </Route>
            <Route path="/">
              <Login />
            </Route>
          </Switch>
        </HashRouter>
      </ThemeProvider>
    )
  }

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
          <Route exact path="/SASjsLogon">
            <Login getCodeOnly />
          </Route>
        </Switch>
      </HashRouter>
    </ThemeProvider>
  )
}

export default App
