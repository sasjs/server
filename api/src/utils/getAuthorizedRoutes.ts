export const getAuthorizedRoutes = () => {
  const streamingApps = Object.keys(process.appStreamConfig)
  const streamingAppsRoutes = streamingApps.map((app) => `/AppStream/${app}`)
  return [...StaticAuthorizedRoutes, ...streamingAppsRoutes]
}

const StaticAuthorizedRoutes = [
  '/AppStream',
  '/SASjsApi/code/execute',
  '/SASjsApi/stp/execute',
  '/SASjsApi/drive/deploy',
  '/SASjsApi/drive/upload',
  '/SASjsApi/drive/file',
  '/SASjsApi/drive/folder',
  '/SASjsApi/drive/fileTree',
  '/SASjsApi/permission'
]
