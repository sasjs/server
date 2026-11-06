import path from 'path'
import express, { Request } from 'express'
import { authenticateAccessToken, generateCSRFToken } from '../../middlewares'
import { folderExists } from '@sasjs/utils'

import {
  addEntryToAppStreamConfig,
  filterGrantedRoutes,
  getFilesFolder,
  ModeType,
  readStoredAppStreamConfig,
  writeStoredAppStreamConfig,
  resolveWithinDrive,
  resolveListeners,
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
 * The landing page itself is always visible to a signed-in caller, so this is
 * the only thing that varies: a tile for an app the caller holds no grant on is
 * a dead end, because the app's own route is permissioned and following the
 * tile answers 401. Each app is decided by the same rule the gate applies to
 * `/AppStream/<name>`, read from the same place, so the list and the gate cannot
 * disagree - and a grant on `/AppStream` itself admits every app, exactly as it
 * does at the gate.
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

/**
 * The same list the landing page renders, as JSON, so the single-page app's home
 * screen can show the apps without scraping the HTML. It answers with the same
 * permission-filtered config the page uses, so the two cannot disagree.
 *
 * Declared before the `/*splat` handler below, which would otherwise serve this
 * path as an app's static asset.
 */
router.get('/apps.json', authenticateAccessToken, async (req, res) => {
  const config = await permittedAppStreamConfig(req)

  return res.json({
    apps: Object.entries(config).map(([name, entry]) => ({
      name,
      appLoc: entry.appLoc,
      // Resolved here rather than in the interface: a configured logo is an
      // asset inside the app, so it is addressed relative to the app's stream
      // path. The landing page resolves the same value the same way.
      logo: entry.streamLogo ? `/AppStream/${name}/${entry.streamLogo}` : null,
      url: `/AppStream/${name}/`
    }))
  })
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

    // the URL the app is reachable on, from the listener configuration rather
    // than a variable nothing sets any more - scheme and port are read together
    // so the pair always describes a listener that exists
    const { config, errors } = resolveListeners(process.env)

    if (config) {
      const port = config.httpPort || config.httpsPort
      const scheme = config.httpPort ? 'http' : 'https'
      // the bound address, not localhost: a listener on 0.0.0.0 or a specific
      // interface is not reachable as localhost from another machine
      const bind = config.httpPort
        ? config.httpBindAddress
        : config.httpsBindAddress
      const host =
        !bind || bind === '0.0.0.0' || bind === '::'
          ? 'localhost'
          : bind.includes(':')
            ? `[${bind}]`
            : bind

      process.logger.info(
        'Serving Stream App: ',
        `${scheme}://${host}:${port}/AppStream/${streamServiceName}`
      )
    } else {
      process.logger.warn(
        'Serving Stream App: ',
        `${streamServiceName} - no listener is configured, so there is no URL to report: ${errors.join(' ')}`
      )
    }
    return { streamServiceName }
  }
  return {}
}

/**
 * Stops advertising a published app, and stops serving it.
 *
 * Publishing does two things, and this undoes both: it writes an entry to the
 * registry that the landing page, its HTML index and `/AppStream/apps.json` are
 * all built from, and it points `appStreams` - the map the handler below serves
 * `/AppStream/<name>` out of - at the deployment's folder. Removing the entry
 * alone would leave an app reachable at a URL that nothing advertises, which is
 * the state that is hardest to reason about: it answers, and no listing offers
 * it.
 *
 * The pair is checked, not just the name. A name that has been republished for a
 * different `appLoc` is a different app, so a caller asking to unpublish the
 * older one must not take the newer one down; a pair that matches no entry
 * answers `false`, which the route renders as a 404 - the same answer as a name
 * the registry never held.
 *
 * The drive content is left alone: deleting the folder is `DELETE
 * /SASjsApi/drive/folder`. Publishing wrote the registry entry and nothing else,
 * so that is what unpublishing removes - there is no permission rule to withdraw,
 * because publishing does not create one. The per-app routes
 * (`getAuthorizedRoutes`) are read from this same registry, so the name drops out
 * of a caller's route inventory as soon as the entry goes.
 *
 * The entry is looked for in the stored registry as well as in memory, because
 * those differ: boot records an entry only when its deployment folder still
 * exists, so an app whose folder was deleted out from under the server is in the
 * file and not in `process.appStreamConfig`. Those are the entries a stale
 * listing is made of, and before this route they had no removal at all.
 */
export const unpublishAppStream = async (
  streamServiceName: string,
  appLoc: string
): Promise<boolean> => {
  const stored = await readStoredAppStreamConfig()

  // the file is the durable record, so it is consulted as well as memory: an
  // entry whose deployment folder went missing is dropped from memory at boot and
  // lives only on disk - and those are exactly the entries a stale listing is
  // made of, so they are the ones most in need of removal.
  const matches = (entry?: { appLoc: string }) =>
    !!entry && entry.appLoc === appLoc

  const inFile = matches(stored[streamServiceName])
  const inMemory = matches(process.appStreamConfig?.[streamServiceName])

  if (!inFile && !inMemory) return false

  if (inFile) {
    // written from the stored view, not from memory: writing memory here would
    // also purge every other entry whose deployment has gone
    delete stored[streamServiceName]
    await writeStoredAppStreamConfig(stored)
  } else {
    delete (process.appStreamConfig as AppStreamConfig)[streamServiceName]
    await writeStoredAppStreamConfig(process.appStreamConfig as AppStreamConfig)
  }

  if (process.appStreamConfig) delete process.appStreamConfig[streamServiceName]

  delete appStreams[streamServiceName]

  return true
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
