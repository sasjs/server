import { Express } from 'express'

import webRouter from './web'
import { ddcHostRouter } from './ddcHost'
import apiRouter from './api'
import appStreamRouter from './appStream'
import { legacyRouteRedirects } from './legacyRouteRedirects'

import {
  authenticateAccessToken,
  authorize,
  csrfProtection
} from '../middlewares'
import { createViyaRouter, viyaGuard } from './viya'
import { isViyaEmulationEnabled, viyaServices } from './viya/services'
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

  // The emulated Viya estate, when a host asks for one. Registered ahead of the
  // web router, which would otherwise answer `/compute/...` with the app shell -
  // and behind the legacy redirects, so a bookmarked old path still lands first.
  // behind the same guard as every other mount that runs caller code: a job
  // submitted here runs on this engine, so an unauthenticated caller must not
  // reach it, and the estate answers as the account the guard resolved
  if (isViyaEmulationEnabled())
    app.use(
      '/',
      // scoped: the guard protects the estate's code paths, and the web router
      // behind it still serves the application shell to a caller who has not
      // signed in - and never guards the estate's own login
      // the guard rewrites `req.url` to the API path the Viya path stands for,
      // so the same permission rules decide a job submission and a file write
      viyaGuard(authenticateAccessToken, authorize),
      createViyaRouter(viyaServices)
    )

  // Registered before the web router, which serves the application for every
  // unmatched path.
  app.use('/', ddcHostRouter)

  app.use('/', webRouter)
}
