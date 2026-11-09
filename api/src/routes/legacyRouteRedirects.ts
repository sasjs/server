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
  '/SASjsApiDocs': '/api',
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
 * an app's own root (`/AppStream/<name>`) moves to `/app/<name>/`. Anything
 * deeper - an app's own assets - is left where it is, because the app that was
 * published under the old prefix may name its files by an absolute path, and
 * redirecting every asset would buy nothing a reader can see.
 */
const target = (path: string): string | undefined => {
  const direct = moved[path]
  if (direct) return direct

  if (path === '/AppStream') return '/app'

  const appRoot = /^\/AppStream\/([^/.]+)$/.exec(path)
  if (appRoot) return `/app/${appRoot[1]}/`

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
