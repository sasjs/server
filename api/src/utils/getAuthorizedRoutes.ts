import { Request } from 'express'

const StaticAuthorizedRoutes = [
  '/AppStream',
  '/SASjsApi/code/execute',
  '/SASjsApi/stp/execute',
  '/SASjsApi/drive/deploy',
  '/SASjsApi/drive/deploy/upload',
  '/SASjsApi/drive/file',
  '/SASjsApi/drive/folder',
  '/SASjsApi/drive/fileTree',
  '/SASjsApi/permission'
]

export const getAuthorizedRoutes = () => {
  const streamingApps = Object.keys(process.appStreamConfig)
  const streamingAppsRoutes = streamingApps.map((app) => `/AppStream/${app}`)
  return [...StaticAuthorizedRoutes, ...streamingAppsRoutes]
}

export const getUri = (req: Request) => {
  const { baseUrl, path: reqPath } = req

  if (baseUrl === '/AppStream') {
    const appStream = reqPath.split('/')[1]

    // removing trailing slash of URLs
    return (baseUrl + '/' + appStream).replace(/\/$/, '')
  }

  return (baseUrl + reqPath).replace(/\/$/, '')
}

export const isAuthorizingRoute = (req: Request): boolean =>
  getAuthorizedRoutes().includes(getUri(req))
