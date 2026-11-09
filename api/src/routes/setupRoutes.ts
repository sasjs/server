import { Express } from 'express'

import webRouter from './web'
import { ddcHostRouter } from './ddcHost'
import apiRouter from './api'
import appStreamRouter from './appStream'
import { legacyRouteRedirects } from './legacyRouteRedirects'

import { csrfProtection } from '../middlewares'
import { API_PREFIXES, APP_STREAM_PREFIXES } from '../utils/routePrefixes'

export const setupRoutes = (app: Express) => {
  // First, so a bookmark of an old path lands on the short one rather than on
  // the app shell (which would resolve it to Home).
  app.use(legacyRouteRedirects)

  // Served at both spellings. The API's canonical spelling is what the
  // permission model and @sasjs/adapter speak; `/api` is the one a reader
  // types. See utils/routePrefixes.ts.
  API_PREFIXES.forEach((prefix) => app.use(prefix, apiRouter))

  // `app.use` rather than passing the router directly, so the CSRF middleware
  // and the router both see the same mount point however it is spelled.
  APP_STREAM_PREFIXES.forEach((prefix) =>
    app.use(prefix, csrfProtection, function (req, res, next) {
      // this needs to be a function to hook on
      // whatever the current router is
      appStreamRouter(req, res, next)
    })
  )

  // Registered before the web router, which serves the application for every
  // unmatched path.
  app.use('/', ddcHostRouter)

  app.use('/', webRouter)
}
