import { Express } from 'express'

import webRouter from './web'
import { ddcHostRouter } from './ddcHost'
import apiRouter from './api'
import appStreamRouter from './appStream'
import { legacyRouteRedirects } from './legacyRouteRedirects'
import { normalizeTierQuery } from '../utils/tierQuery'
import { tierProgramRequest } from '../utils/tierPostVariables'

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

/**
 * The tier's refusal when a request names both of its parameters.
 *
 * One sentence, one place per side: this server mints it, and the mock host in
 * sasjs/cli answers it verbatim so a page behaves here as it does there. Both
 * are asserted, and `docs/pages/apps.md` names the other copy - a message that
 * only has to change in one file is a message that changes in one file.
 */
export const TIER_NEEDS_ONE_PARAMETER =
  'Exactly one of "_program" and "_FILE" may be given.'

export const setupRoutes = (app: Express) => {
  // First, so a bookmark of an old path lands on the short one rather than on
  // the app shell (which would resolve it to Home).
  app.use(legacyRouteRedirects)

  // Served at both spellings. The API's canonical spelling is what the
  // permission model and @sasjs/adapter speak; `/api` is the one a reader
  // types. See utils/routePrefixes.ts.
  API_PREFIXES.forEach((prefix) => app.use(prefix, apiRouter))

  /**
   * The web tiers a page talks through, answered as the API operation they
   * stand for.
   *
   * Each SAS platform has one address a browser fetches a program or a file
   * from: `/SASStoredProcess` on SAS 9, `/SASJobExecution` on SAS Viya. This
   * server's own is `/StoredProgram`, which is what a SASjs build links to; the
   * estate's spelling is kept beside it so a build made for Viya opens here
   * unmodified - which is the whole point, since that address cannot be rewritten
   * at deploy time.
   *
   * Each tier speaks the two parameters its platform's tier speaks: `_FILE=` for
   * a file to read, `_program=` for a stored program to run. `/StoredProgram`
   * answers both; `/SASJobExecution` answers `_FILE=`, which is the one a
   * streamed build links to, and keeps its own POST stub for the rest.
   *
   * Both are handed to the API as the path they stand for - `/drive/file` or
   * `/stp/execute` - so the same guard, the same permission rule and the same
   * handler answer them: these are spellings of one operation each, not
   * operations that could drift from them.
   */
  for (const webTier of ['/StoredProgram', '/SASJobExecution'])
    app.use(webTier, (req, res, next) => {
      // The mount is prefix-matched by Express, but the tier is the root only.
      if (req.path !== '/') return next()

      const { url, baseUrl } = req
      const { search, hasFile, hasProgram } = normalizeTierQuery(url)

      // one file, or one program, never both: the two answer different things,
      // and choosing silently would answer a question the caller did not ask -
      // the same rule the drive read applies to its own two names. The drive's
      // pair has a constant in @sasjs/api (`ONE_NAME_ONLY`); this one is the
      // tier's own routing rule, so it is minted here rather than in the
      // package - and its one other copy is the sentence the mocked host answers
      // on the same two parameters (sasjs/cli, mockSite/assets/sw.js, the
      // constant `TIER_NEEDS_ONE_PARAMETER`). Both are pinned by a spec that
      // asserts the exact wording, and docs/pages/apps.md says where the copy
      // lives, so a rewording cannot pass one repo and miss the other silently.
      if (hasProgram && hasFile)
        return res.status(400).send(TIER_NEEDS_ONE_PARAMETER)

      // a program to run: the estate's other parameter, on the tier that stands
      // where the estate's tiers stand. The method travels too - the adapter
      // posts a program with its input data, a browser may get it
      if (webTier === '/StoredProgram' && hasProgram) {
        req.url = `/stp/execute${search}`
        req.baseUrl = API_PREFIX
        ;(req as any)[tierProgramRequest] = true

        return apiRouter(req, res, (error?: unknown) => {
          delete (req as any)[tierProgramRequest]
          req.url = url
          req.baseUrl = baseUrl

          next(error as Error)
        })
      }

      if (req.method !== 'GET' || !hasFile) return next()

      // Carry all query pairs through so the API sees conflicts and other inputs.
      req.url = `/drive/file${search}`
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
