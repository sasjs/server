import path from 'path'
import express, { ErrorRequestHandler } from 'express'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'

import {
  copySASjsCore,
  createWeboutSasFile,
  getFilesFolder,
  getPackagesFolder,
  getWebBuildFolder,
  instantiateLogger,
  loadAppStreamConfig,
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
  configureSecurity
} from './app-modules'
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

  app.use(express.json({ limit: '100mb' }))
  app.use(express.static(path.join(__dirname, '../public')))

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

  app.use(onError)

  return app
})
