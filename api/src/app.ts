import path from 'path'
import express, { ErrorRequestHandler, CookieOptions } from 'express'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'

import {
  copySASjsCore,
  getWebBuildFolder,
  instantiateLogger,
  loadAppStreamConfig,
  ProtocolType,
  ReturnCode,
  setProcessVariables,
  setupFolders,
  verifyEnvVariables
} from './utils'
import {
  configureCors,
  configureDomains,
  configureExpressSession,
  configureLogger,
  configureSecurity
} from './app-modules'

dotenv.config()

instantiateLogger()

if (verifyEnvVariables()) process.exit(ReturnCode.InvalidEnv)

const app = express()

const { PROTOCOL } = process.env

export const cookieOptions: CookieOptions = {
  secure: PROTOCOL === ProtocolType.HTTPS,
  httpOnly: true,
  sameSite: PROTOCOL === ProtocolType.HTTPS ? 'none' : undefined,
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}

const onError: ErrorRequestHandler = (err, req, res, next) => {
  console.error(err.stack)
  res.status(500).send('Something broke!')
}

export default setProcessVariables().then(async () => {
  app.use(cookieParser())

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
   *         Allowed Domains         *
   ***********************************/
  configureDomains(app)

  /***********************************
   *         DB Connection &          *
   *        Express Sessions          *
   *        With Mongo Store          *
   ***********************************/
  configureExpressSession(app)

  app.use(express.json({ limit: '100mb' }))
  app.use(express.static(path.join(__dirname, '../public')))

  // Body parser is used for decoding the formdata on POST request.
  // Currently only place we use it is SAS9 Mock - POST /SASLogon/login
  app.use(express.urlencoded({ extended: true }))

  await setupFolders()
  await copySASjsCore()

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
