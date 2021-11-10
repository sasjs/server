import React from 'react'
import { Route, HashRouter, Switch } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import { theme } from './theme'

import Login from './components/login'
import Header from './components/header'
import Home from './components/home'
import Drive from './containers/Drive'
import Studio from './containers/Studio'

import useTokens from './components/useTokens'

function App() {
  const { tokens, setTokens } = useTokens()

  if (!tokens) {
    return (
      <ThemeProvider theme={theme}>
        <HashRouter>
          <Header />
          <Login setTokens={setTokens} />
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
        </Switch>
      </HashRouter>
    </ThemeProvider>
  )
}

export default App
