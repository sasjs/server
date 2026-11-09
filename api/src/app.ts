import path from 'path'
import express, { ErrorRequestHandler } from 'express'
import cookieParser from 'cookie-parser'
import compression from 'compression'
import dotenv from 'dotenv'

import {
  API_PREFIXES,
  copySASjsCore,
  createWeboutSasFile,
  getFilesFolder,
  getPackagesFolder,
  getWebBuildFolder,
  instantiateLogger,
  loadAppStreamConfig,
  ModeType,
  ReturnCode,
  setProcessVariables,
  setupFilesFolder,
  setupPackagesFolder,
  setupUserAutoExec,
  verifyEnvVariables
} from './utils'
import {
  configureCors,
  configureExpressSession,
  configureLogger,
  configureSecurity,
  docsInlineScripts
} from './app-modules'
import { DEPLOY_PAYLOAD_BYTES } from '@sasjs/api'
import { setCSRFCookie } from './middlewares'
import { folderExists } from '@sasjs/utils'

dotenv.config({ quiet: true })

instantiateLogger()

if (verifyEnvVariables()) process.exit(ReturnCode.InvalidEnv)

const app = express()

const onError: ErrorRequestHandler = (err, req, res, next) => {
  process.logger.error(err.stack)
  res.status(500).send('Something broke!')
}

export default setProcessVariables().then(async () => {
  app.use(cookieParser())

  // Behind a TLS-terminating proxy (Cloudron, any reverse proxy) the
  // connection the app sees is plain HTTP, so req.secure and req.ip describe
  // the proxy rather than the client. TRUST_PROXY states how much of the
  // X-Forwarded-* chain to believe, which is what lets the session cookie be
  // marked Secure on an HTTPS site and what a client-IP-keyed throttle would
  // need. Left unset, nothing is trusted - the right default for a deployment
  // that receives traffic directly.
  if (process.env.TRUST_PROXY) {
    app.set(
      'trust proxy',
      /^\d+$/.test(process.env.TRUST_PROXY)
        ? Number(process.env.TRUST_PROXY)
        : process.env.TRUST_PROXY === 'true'
          ? true
          : process.env.TRUST_PROXY === 'false'
            ? false
            : process.env.TRUST_PROXY.split(',').map((entry) => entry.trim())
    )
  }

  configureLogger(app)

  /***********************************
   *   Handle security and origin    *
   ***********************************/
  configureSecurity(app)

  // The docs site carries its own inline scripts (Material's scope helper, and
  // the palette block in docs/theme/main.html), which helmet's `script-src
  // 'self'` refuses. Relaxed for this mount only, and set here - immediately
  // after helmet, before any handler - because the web build's static mount at
  // the root also answers `/docs/...`, so a middleware placed beside the docs
  // mount would never run for a build that carries the pages.
  app.use('/docs', docsInlineScripts)

  /***********************************
   *      Compress text responses    *
   ***********************************/
  // Before the routes, so every body that can be encoded is: an App Stream app
  // is a build output (a single-page app's bundle is easily 10MB of JavaScript
  // and CSS), and serving it raw costs the first paint seconds - measured at
  // 8.5s to first contentful paint against a 0.34 performance score, and 2.8s
  // through a gzipping front end. `compression` only touches compressible
  // content types and skips bodies under a kilobyte, so binary exports (zip,
  // xlsx, SAS7BDAT) and small JSON answers pass through untouched, and
  // `text/event-stream` is excluded by the compressible check, which is what
  // keeps streaming responses un-buffered.
  app.use(compression())

  /***********************************
   *         Enabling CORS           *
   ***********************************/
  configureCors(app)

  /***********************************
   *         DB Connection &          *
   *        Express Sessions          *
   *        With Mongo Store          *
   ***********************************/
  configureExpressSession(app)

  // The deploy cap is stated in DECODED bytes and its tree travels as JSON, in
  // which file contents are base64 - 4/3 of what they write - so a tree at the
  // cap is up to ~134MB on the wire. That parser is mounted for the deploy
  // routes ONLY: everything else keeps the global limit below, because a
  // request body is buffered before authentication and no other route needs the
  // headroom. Matching on the folder also covers /drive/deploy/upload, whose
  // body is multipart and which express.json therefore ignores.
  // Mounted on every spelling of the API prefix: the alias buffers the same
  // body, so a deploy that succeeds on /SASjsApi/drive/deploy must not be
  // refused with entity.too.large on /api/drive/deploy.
  API_PREFIXES.forEach((prefix) =>
    app.use(
      `${prefix}/drive/deploy`,
      express.json({ limit: DEPLOY_PAYLOAD_BYTES })
    )
  )
  app.use(express.json({ limit: '100mb' }))
  app.use(express.static(path.join(__dirname, '../public')))

  // The API documentation page, at the short prefix as well as the canonical
  // one (`/SASjsApi`). It is the same files either way: index.html and the
  // swagger-ui build copied beside it, both served straight out of
  // public/SASjsApi. Declared here, before the API router is mounted, so the
  // static assets answer first and everything else falls through to the router.
  app.use('/api', express.static(path.join(__dirname, '../public/SASjsApi')))

  // NOTE: no urlencoded body parser here. The only consumer of
  // form-encoded bodies is the SAS9 mock's login form, which mounts its own
  // parser inside the mock router (routes/web/sas9-web.ts) - keeping this
  // global was body-parsing surface with no production need.

  // Express 5 leaves req.body undefined when the request carries no parsable
  // body (express 4 defaulted it to {}). Every route handler validates
  // req.body with joi and assumes an object, and joi 18's validate(undefined)
  // succeeds silently, so restore the express 4 default here.
  app.use((req, _res, next) => {
    if (req.body === undefined) req.body = {}
    next()
  })

  await setupUserAutoExec()

  if (!(await folderExists(getFilesFolder()))) await setupFilesFolder()

  // The drive-root `.sasjslint` is the default lint/format rules file, so seed
  // it before the first lint or format request can read it.
  const { seedDefaultLintConfig } = await import('./utils/lintConfig')
  await seedDefaultLintConfig()

  if (!(await folderExists(getPackagesFolder()))) await setupPackagesFolder()

  // Every user gets /home/<username> and the grants that reach it. New accounts
  // are provisioned as they are created (UserController.createUser); this pass
  // covers the accounts that were made before that existed. Server mode only -
  // desktop has a single fixed account and no database.
  if (process.env.MODE === ModeType.Server) {
    const { provisionAllUserHomes } = await import('./utils/provisionUserHome')

    try {
      const homes = await provisionAllUserHomes()

      if (homes.folders || homes.grants)
        console.log(
          `[info] provisioned ${homes.folders} user home folder(s) and ${homes.grants} grant(s) across ${homes.users} user(s)`
        )
    } catch (err) {
      console.log(
        '[warn] user home provisioning failed:',
        err instanceof Error ? err.message : err
      )
    }
  }

  const sasautosPath = path.join(process.driveLoc, 'sas', 'sasautos')
  if (await folderExists(sasautosPath)) {
    process.logger.warn(
      `SASAUTOS was not refreshed. To force a refresh, delete the ${sasautosPath} folder`
    )
  } else {
    await copySASjsCore()
    await createWeboutSasFile()
  }

  // loading these modules after setting up variables due to
  // multer's usage of process var process.driveLoc
  const { setupRoutes } = await import('./routes/setupRoutes')
  setupRoutes(app)

  await loadAppStreamConfig()

  // should be served after setting up web route
  // index.html needs to be injected with some js script.
  app.use(express.static(getWebBuildFolder()))

  // The documentation site, built from docs/ into the web build and served
  // beside the interface: a static site of its own, public like the build it
  // sits in. Mounted here, before the shell fallback below, so its paths never
  // reach the SPA's router.
  app.use('/docs', express.static(path.join(getWebBuildFolder(), 'docs')))

  // A build that skipped the docs step has no pages to serve. The link is one
  // the interface advertises, so it says what is missing rather than answering
  // with the interface's own 404.
  app.get(['/docs', '/docs/*splat'], (_req, res) => {
    res
      .status(404)
      .type('html')
      .send(
        '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
          '<title>No documentation</title></head><body>' +
          '<h1>This build carries no documentation</h1>' +
          '<p>The pages are built from <code>docs/</code> and copied into the ' +
          'web build, and this build skipped that step - a development ' +
          'checkout unless <code>npm run docs:build</code> has been run. The ' +
          'published site carries the same pages.</p></body></html>'
      )
  })

  // The interface's own screens are real paths, so a deep link or a refresh -
  // /studio, /settings - arrives here with no file to serve. Anything
  // that reaches this point is not an API route, not an AppStream app and not a
  // file, so it is one of the interface's routes: serve the app shell and let
  // the router resolve it.
  //
  // The reserved prefixes are refused rather than answered with HTML, so an
  // unknown API path stays a 404 instead of turning into the app shell.
  app.get('/*splat', async (req, res) => {
    if (!req.accepts('html')) return res.status(404).send('Not Found')

    // Express matches the mounted routers case-insensitively, so the refusal
    // has to be case-insensitive too - otherwise /sasjsapi/unknown falls past
    // the API router and is answered with the app shell.
    //
    // The API's own documentation page is at the exact path /SASjsApi (and
    // /api), which express.static answers before this runs, so the prefix here
    // ends in a slash: every path below the API mount stays a 404 rather than
    // being answered with the app shell.
    const reserved = [
      '/sasjsapi/',
      '/appstream',
      '/app/',
      '/api/',
      '/saslogon',
      '/docs/'
    ]
    const requestPath = req.path.toLowerCase()
    if (reserved.some((prefix) => requestPath.startsWith(prefix)))
      return res.status(404).send('Not Found')

    // A path that names a file is an asset request, not a route. Answering it
    // with the app shell would turn a missing bundle into a confusing MIME
    // error in the browser rather than an honest 404.
    if (/\.[a-z0-9]+$/i.test(req.path)) return res.status(404).send('Not Found')

    try {
      const { WebController } = await import('./controllers/web')
      const shell = await new WebController().home()

      // The web router's own shell route hands back the CSRF token as a cookie
      // header, and this serves the same shell - so it sets the cookie too, or
      // the two entry points differ in their side effects and a deep link
      // depends on the client fetching / for the token.
      setCSRFCookie(req, res)

      return res.send(shell)
    } catch (_) {
      return res.status(404).send('Web Build is not present')
    }
  })

  app.use(onError)

  return app
})
