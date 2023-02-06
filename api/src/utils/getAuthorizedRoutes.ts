import { Request } from 'express'

export const TopLevelRoutes = ['/AppStream', '/SASjsApi']

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

export const getPath = (req: Request) => {
  const { baseUrl, path: reqPath } = req

  if (baseUrl === '/AppStream') {
    const appStream = reqPath.split('/')[1]

    // removing trailing slash of URLs
    return (baseUrl + '/' + appStream).replace(/\/$/, '')
  }

  return (baseUrl + reqPath).replace(/\/$/, '')
}

export const isAuthorizingRoute = (req: Request): boolean =>
  getAuthorizedRoutes().includes(getPath(req))
