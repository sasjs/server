import express, { Request, Response } from 'express'

import { authenticateAccessToken, generateCSRFToken } from '../../middlewares'
import {
  createAppStreamWebService,
  isAppId,
  NO_SUCH_APP,
  type AppStreamEntry,
  type AppStreamPage,
  type AppStreamWebService
} from '@sasjs/api'

import {
  API_PREFIX,
  APP_STREAM_ALIAS,
  appIsGranted,
  appStreamDrive,
  appStreamEntries,
  appStreamService,
  isRouteGranted,
  loadRouteRules,
  ModeType
} from '../../utils'
import User from '../../model/User'

/**
 * The App Stream surface: the landing page, the listing, an app's own files and
 * the removal of one.
 *
 * All of it is `@sasjs/api`'s. The package decides what the listing says, what a
 * missing app answers, how an asset is found inside a deployment, what is
 * cacheable and what a `DELETE` removes - so this host, the browser build and
 * the conformance corpus cannot drift apart, which is how the name-keyed
 * registry and the two hand-written implementations diverged before.
 *
 * What stays here is the transport and the one thing a package cannot know: who
 * is asking. Express renders a `AppStreamPage`; the permission grant that admits
 * an app is read from this server's database.
 */
const appStreamWeb = (): AppStreamWebService =>
  createAppStreamWebService(appStreamService(), appStreamDrive(), {
    basePath: APP_STREAM_ALIAS
  })

/**
 * The ids of the apps this caller may open.
 *
 * The package asks this per entry - `allow` - so the answer is a set built once
 * per request rather than a query per app. Each app is decided by the same rule
 * the gate applies to its own route: a grant on the app's id, or on the label it
 * carries (see `appGrantPaths`), or on `/AppStream` itself, which admits them
 * all.
 *
 * Desktop mode has no permission model - `authenticateAccessToken` bypasses the
 * gate there - so every app stands.
 */
const allowedAppIds = async (req: Request): Promise<Set<string>> => {
  // read from what boot and the last publish left: this runs for every asset a
  // page loads, and the index cannot change while the process serves it
  const entries = appStreamEntries()

  if (process.env.MODE === ModeType.Desktop)
    return new Set(entries.map((entry) => entry.id))

  const dbUser = await User.findOne({ _id: req.user?.userId })

  if (!dbUser) return new Set()

  if (dbUser.isAdmin) return new Set(entries.map((entry) => entry.id))

  const rules = await loadRouteRules(dbUser)

  return new Set(
    entries
      .filter((entry: AppStreamEntry) => appIsGranted(entry, rules))
      .map((entry) => entry.id)
  )
}

/** The route the landing page is answered on, whatever the mount spelling. */
const isLanding = (path: string): boolean => {
  const clean = (path.split(/[?#]/)[0] || '/').replace(/\/+$/, '')

  return (
    clean === APP_STREAM_ALIAS || clean === `${APP_STREAM_ALIAS}/index.html`
  )
}

/**
 * One package answer, rendered by express.
 *
 * The status, the headers the package set (caching, `allow`, the framing policy
 * of the app being served) and the body travel together, so a host cannot answer
 * a page's status with another page's body.
 */
const render = (req: Request, res: Response, page: AppStreamPage) => {
  res.status(page.status)

  for (const [name, value] of Object.entries(page.headers ?? {}))
    res.setHeader(name, value)

  if (page.location) return res.redirect(page.status, page.location)

  // The interface fetches the CSRF token from the landing screen, so the page
  // that hands out the app list keeps handing it out.
  if (isLanding(req.originalUrl))
    res.cookie('XSRF-TOKEN', generateCSRFToken(req))

  if (page.contentType) res.type(page.contentType)

  return res.send(
    typeof page.body === 'undefined'
      ? ''
      : typeof page.body === 'string'
        ? page.body
        : Buffer.from(page.body)
  )
}

/**
 * Whether this caller may take an app down.
 *
 * The surface's `allow` predicate is a VIEW filter - the package uses it to
 * decide which app a request may see, and then removes what it resolved - so
 * passing it the grant that admits an app would let everyone who can open an
 * app also delete it. Removal is the deploy route's permission, which is what
 * `DELETE /SASjsApi/drive/deploy` requires and what the interface gates the bin
 * on. Desktop mode has no permission model.
 */
const mayUnpublish = async (req: Request): Promise<boolean> => {
  if (process.env.MODE === ModeType.Desktop) return true

  const dbUser = await User.findOne({ _id: req.user?.userId })

  if (!dbUser) return false

  if (dbUser.isAdmin) return true

  return isRouteGranted(
    await loadRouteRules(dbUser),
    `${API_PREFIX}/drive/deploy`,
    API_PREFIX
  )
}

/**
 * The refusal a `DELETE` earns, or undefined when the request may proceed.
 *
 * Two things the surface leaves to its host. The first is WHO may remove: see
 * `mayUnpublish`. The second is that a removal names an **id** - the package
 * resolves a label as a courtesy to a bookmark, which is right for opening an
 * app and wrong for deleting one, where a label that a later publish reuses
 * would remove an app nobody named. A label-addressed removal answers the same
 * `404` as an unknown app, so a caller cannot use it to ask whether a name is
 * taken.
 */
const removalRefusal = async (
  req: Request
): Promise<{ status: number; body?: string } | undefined> => {
  if (!(await mayUnpublish(req))) return { status: 401 }

  const segment = req.path.replace(/^\/+|\/+$/g, '')

  if (!segment || !isAppId(decodeURIComponent(segment)))
    return { status: 404, body: NO_SUCH_APP }

  return undefined
}

const router = express.Router()

router.use(authenticateAccessToken)

/**
 * The request's path as the package reads it.
 *
 * The surface is mounted at both spellings, and the package knows one base path,
 * so the canonical prefix is translated to the short one. That is the same
 * request, not an alias for something else: `/AppStream/apps.json` and
 * `/app/apps.json` answer the same listing. It does NOT translate what follows
 * the prefix - that segment is an app's id, and a name is not one, so an app's
 * own URL under the old prefix still 404s rather than being guessed at.
 */
const surfacePath = (req: Request): string => `${APP_STREAM_ALIAS}${req.path}`

/**
 * Every path and method the surface answers, including the ones it refuses:
 * the package decides a `405` for a method it does not take, and express's own
 * `404` would say nothing about why.
 *
 * Mounted at `/app` and at `/AppStream` (see setupRoutes), and the package is
 * handed the short spelling for both: the two prefixes are one surface, so the
 * listing answers on either. What follows the prefix is not translated, so an
 * app's own URL under the old prefix 404s - its name is not its address.
 */
router.all(['/', '/*splat'], async (req: Request, res: Response) => {
  if (req.method === 'DELETE') {
    const refusal = await removalRefusal(req)

    if (refusal) return res.status(refusal.status).send(refusal.body)
  }

  const allow = await allowedAppIds(req)
  const page = await appStreamWeb().request({
    method: req.method,
    path: surfacePath(req),
    allow: (entry) => allow.has(entry.id)
  })

  return render(req, res, page)
})

export default router
