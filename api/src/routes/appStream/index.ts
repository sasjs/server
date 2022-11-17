import path from 'path'
import express, { Request } from 'express'
import { authenticateAccessToken, generateCSRFToken } from '../../middlewares'
import { folderExists } from '@sasjs/utils'

import { addEntryToAppStreamConfig, getFilesFolder } from '../../utils'
import { appStreamHtml } from './appStreamHtml'

const appStreams: { [key: string]: string } = {}

const router = express.Router()

router.get('/', authenticateAccessToken, async (req, res) => {
  const content = appStreamHtml(process.appStreamConfig)

  res.cookie('XSRF-TOKEN', generateCSRFToken())

  return res.send(content)
})

export const publishAppStream = async (
  appLoc: string,
  streamWebFolder: string,
  streamServiceName?: string,
  streamLogo?: string,
  addEntryToFile: boolean = true
) => {
  const driveFilesPath = getFilesFolder()

  const appLocParts = appLoc.replace(/^\//, '')?.split('/')
  const appLocPath = path.join(driveFilesPath, ...appLocParts)
  if (!appLocPath.includes(driveFilesPath)) {
    throw new Error('appLoc cannot be outside drive.')
  }

  const pathToDeployment = path.join(appLocPath, 'services', streamWebFolder)
  if (!pathToDeployment.includes(appLocPath)) {
    throw new Error('streamWebFolder cannot be outside appLoc.')
  }

  if (await folderExists(pathToDeployment)) {
    const appCount = process.appStreamConfig
      ? Object.keys(process.appStreamConfig).length
      : 0

    if (!streamServiceName) {
      streamServiceName = `AppStreamName${appCount + 1}`
    }

    appStreams[streamServiceName] = pathToDeployment

    addEntryToAppStreamConfig(
      streamServiceName,
      appLoc,
      streamWebFolder,
      streamLogo,
      addEntryToFile
    )

    const sasJsPort = process.env.PORT || 5000
    process.logger.info(
      'Serving Stream App: ',
      `http://localhost:${sasJsPort}/AppStream/${streamServiceName}`
    )
    return { streamServiceName }
  }
  return {}
}

router.get(`/*`, authenticateAccessToken, function (req: Request, res, next) {
  const reqPath = req.path.replace(/^\//, '')

  // Redirecting to url with trailing slash for appStream base URL only
  if (reqPath.split('/').length === 1 && !reqPath.endsWith('/'))
    // navigating to same url with slash at start
    return res.redirect(301, `${reqPath}/`)

  const appStream = reqPath.split('/')[0]
  const appStreamFilesPath = appStreams[appStream]
  if (appStreamFilesPath) {
    // resourcePath is without appStream base path
    const resourcePath = reqPath.split('/').slice(1).join('/') || 'index.html'

    req.url = resourcePath

    return express.static(appStreamFilesPath)(req, res, next)
  }

  return res.send("There's no App Stream available here.")
})

export default router
