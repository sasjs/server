import { Request } from 'express'

export const TopLevelRoutes = ['/AppStream', '/SASjsApi']

// Being authenticated is enough for most routes. These specifically also
// require a granted Permission (checked by the authorize middleware) because
// they run arbitrary submitted code or manipulate arbitrary files on disk - a
// narrower blast radius than everything else a logged-in user can do.
const StaticAuthorizedRoutes = [
  '/SASjsApi/code/execute',
  '/SASjsApi/stp/execute',
  '/SASjsApi/drive/deploy',
  '/SASjsApi/drive/deploy/upload',
  '/SASjsApi/drive/file',
  '/SASjsApi/drive/folder',
  '/SASjsApi/drive/fileTree',
  '/SASjsApi/drive/rename'
]

export const getAuthorizedRoutes = () => {
  const streamingApps = Object.keys(process.appStreamConfig)
  const streamingAppsRoutes = streamingApps.map((app) => `/AppStream/${app}`)
  return [...TopLevelRoutes, ...StaticAuthorizedRoutes, ...streamingAppsRoutes]
}

/**
 * Express matches routes case-insensitively by default, but `req.baseUrl` and
 * `req.path` preserve the case the client sent. Comparing the raw request path
 * against the canonical route list therefore let a mixed-case URL
 * (`/SASJSAPI/DRIVE/FILETREE`) match the ROUTE while failing the PERMISSION
 * lookup, skipping `authorize` entirely - an authorisation bypass for every
 * route that requires a Permission grant.
 *
 * To close that, the path used for permission matching is resolved to its
 * CANONICAL form: matched case-insensitively against the authorised route
 * inventory, and replaced with the canonical spelling when it matches. A
 * case-varied request then (a) still hits the permission gate and (b) matches
 * Permission records stored under the canonical spelling. When no
 * authorising route matches, the raw (merely slash-trimmed) path is returned -
 * `isPublicRoute` looks up paths that can legitimately carry any case a
 * Permission was created with, and those records are user-created.
 */
export const canonicalizeRoutePath = (candidate: string): string => {
  const trimmed = candidate.replace(/\/$/, '')

  const match = getAuthorizedRoutes().find(
    (route) => route.toLowerCase() === trimmed.toLowerCase()
  )

  return match ?? trimmed
}

export const getPath = (req: Request) => {
  const { baseUrl, path: reqPath } = req

  if (baseUrl === '/AppStream') {
    const appStream = reqPath.split('/')[1]

    // removing trailing slash of URLs
    return canonicalizeRoutePath(baseUrl + '/' + appStream)
  }

  return canonicalizeRoutePath(baseUrl + reqPath)
}

export const isAuthorizingRoute = (req: Request): boolean =>
  getAuthorizedRoutes().includes(getPath(req))
