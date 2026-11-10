import { Request, RequestHandler, Response } from 'express'

/**
 * The interface's paths before it had short URLs, and where they point now.
 *
 * These are navigation paths only. The API's canonical spelling (`/SASjsApi`)
 * is NOT here: it is addressed by `@sasjs/adapter` and by existing clients, so
 * it keeps answering rather than redirecting. `/AppStream` is handled
 * separately below because it is a prefix, not a single page.
 */
const moved: Record<string, string> = {
  '/SASjsDocs': '/docs',
  '/SASjsApiDocs': '/api-assets/',
  '/SASjsStudio': '/studio',
  '/SASjsApps': '/apps',
  '/SASjsSettings': '/settings',
  '/SASjsLogon': '/logon'
}

/** The query string of the request, so a deep link keeps its parameters. */
const queryOf = (req: Request): string => {
  const index = req.originalUrl.indexOf('?')

  return index === -1 ? '' : req.originalUrl.slice(index)
}

/**
 * Where a moved path now lives, or undefined when the path did not move.
 *
 * `/AppStream` is the App Stream prefix: the landing page moves to `/app`, and
 * that redirect stays.
 *
 * `/AppStream/<anything>` does NOT redirect, and is not rewritten here. It is
 * left to the middleware that follows, which mounts the App Stream surface at
 * both prefixes - so the segment is resolved the way `/app/<segment>` is: an id
 * serves the app, and so does a label only one app carries, which is what a
 * stale bookmark of the old name-shaped URL was written with. A segment that
 * names nothing answers the surface's `404`; there is no redirect to invent,
 * because the app's own address is its id and only the surface knows it.
 */
const target = (path: string): string | undefined => {
  const direct = moved[path]
  if (direct) return direct

  if (path === '/AppStream') return '/app'

  return undefined
}

/**
 * Redirects the interface's old URLs to their short ones.
 *
 * Mounted before every router, so a bookmark of `/SASjsStudio` lands on
 * `/studio` even though the app shell would happily have answered it.
 *
 * Only GET and HEAD are redirected. A 301 on a state-changing request is
 * replayed by some clients as a GET - a request that would then answer with
 * the app shell rather than doing what it asked - and no moved path is an API
 * route, so nothing that needs another method moves anyway.
 */
export const legacyRouteRedirects: RequestHandler = (
  req: Request,
  res: Response,
  next
) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next()

  // A trailing slash names the same page: `/SASjsStudio/` moved with it.
  const path = req.path.replace(/\/+$/, '') || '/'
  const destination = target(path)

  if (!destination) return next()

  return res.redirect(301, destination + queryOf(req))
}
