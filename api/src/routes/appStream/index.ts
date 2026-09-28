import path from 'path'
import express, { Request } from 'express'
import { authenticateAccessToken, generateCSRFToken } from '../../middlewares'
import { folderExists } from '@sasjs/utils'

import {
  addEntryToAppStreamConfig,
  filterGrantedRoutes,
  getFilesFolder,
  ModeType,
  resolveWithinDrive,
  isSafePathSegment
} from '../../utils'
import User from '../../model/User'
import { AppStreamConfig } from '../../types'
import { appStreamHtml } from './appStreamHtml'

const appStreams: { [key: string]: string } = {}

const router = express.Router()

/**
 * The apps this caller may open.
 *
 * A tile for an app the caller holds no grant on is a dead end: the app's own
 * route is permissioned, so following the tile answers 401. Each app is decided
 * by the same rule the gate applies to `/AppStream/<name>`, read from the same
 * place, so the list and the gate cannot disagree - and a grant on `/AppStream`
 * itself admits every app, exactly as it does at the gate.
 *
 * Desktop mode has no permission model (authenticateAccessToken bypasses the
 * gate there), so the whole list stands.
 */
const permittedAppStreamConfig = async (
  req: Request
): Promise<AppStreamConfig> => {
  const appStreamConfig = process.appStreamConfig ?? {}

  if (process.env.MODE === ModeType.Desktop) return appStreamConfig

  const dbUser = await User.findOne({ _id: req.user?.userId })
  if (!dbUser) return {}

  const names = Object.keys(appStreamConfig)
  const granted = await filterGrantedRoutes(
    dbUser,
    names.map((name) => `/AppStream/${name}`)
  )

  return names.reduce((config: AppStreamConfig, name) => {
    if (granted.indexOf(`/AppStream/${name}`) > -1)
      config[name] = appStreamConfig[name]

    return config
  }, {})
}

router.get('/', authenticateAccessToken, async (req, res) => {
  const content = appStreamHtml(await permittedAppStreamConfig(req))

  res.cookie('XSRF-TOKEN', generateCSRFToken(req))

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
  const appLocPath = resolveWithinDrive(appLoc)
  if (!appLocPath) {
    throw new Error('appLoc cannot be outside drive.')
  }

  // streamWebFolder must itself be a single safe segment: joined naively it
  // could climb out of the deployment (and the drive) the same way a member
  // name can.
  if (!isSafePathSegment(streamWebFolder)) {
    throw new Error('streamWebFolder must be a single path segment.')
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

// Express 5 (path-to-regexp v8) requires wildcard segments to be named;
// a bare `*` throws at router registration time. The name is unused here
// because the handler reads `req.path` directly.
router.get(
  `/*splat`,
  authenticateAccessToken,
  function (req: Request, res, next) {
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
  }
)

export default router
