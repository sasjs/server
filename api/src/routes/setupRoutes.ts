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
import {
  API_PREFIX,
  API_PREFIXES,
  APP_STREAM_PREFIXES
} from '../utils/routePrefixes'

export const setupRoutes = (app: Express) => {
  // First, so a bookmark of an old path lands on the short one rather than on
  // the app shell (which would resolve it to Home).
  app.use(legacyRouteRedirects)

  // Served at both spellings. The API's canonical spelling is what the
  // permission model and @sasjs/adapter speak; `/api` is the one a reader
  // types. See utils/routePrefixes.ts.
  API_PREFIXES.forEach((prefix) => app.use(prefix, apiRouter))

  /**
   * The web tiers a streamed page links through, answered as the API read they
   * stand for.
   *
   * Each SAS platform has one address a browser fetches a program or a file
   * from: `/SASStoredProcess` on SAS 9, `/SASJobExecution` on SAS Viya. This
   * server's own is `/StoredProgram`, which is what a SASjs build links to; the
   * estate's spelling is kept beside it so a build made for Viya opens here
   * unmodified - which is the whole point, since that address cannot be rewritten
   * at deploy time.
   *
   * Both are handed to the API as the path they stand for -
   * `/SASjsApi/drive/file` - so the same guard, the same permission rule and the
   * same handler answer them: these are spellings of one operation, not
   * operations that could drift from it.
   */
  for (const webTier of ['/StoredProgram', '/SASJobExecution'])
    app.use(webTier, (req, res, next) => {
      if (req.method !== 'GET' || typeof req.query._FILE !== 'string')
        return next()

      const { url, baseUrl } = req

      // the query travels as it arrived, not just the one name this spelling
      // knows: a request that names the file twice has to earn the same refusal
      // here as on the API spelling, rather than having one of them quietly
      // dropped on the way
      const params = new URLSearchParams({ _FILE: String(req.query._FILE) })

      if (typeof req.query._filePath === 'string')
        params.set('_filePath', req.query._filePath)

      req.url = `/drive/file?${params}`
      req.baseUrl = API_PREFIX

      return apiRouter(req, res, (error?: unknown) => {
        req.url = url
        req.baseUrl = baseUrl

        next(error as Error)
      })
    })

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
