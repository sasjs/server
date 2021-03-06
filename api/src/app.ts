import path from 'path'
import express, { ErrorRequestHandler } from 'express'
import csrf from 'csurf'
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
  configureExpressSession,
  configureLogger,
  configureSecurity
} from './app-modules'

dotenv.config()

instantiateLogger()

if (verifyEnvVariables()) process.exit(ReturnCode.InvalidEnv)

const app = express()

const { PROTOCOL } = process.env

export const cookieOptions = {
  secure: PROTOCOL === ProtocolType.HTTPS,
  httpOnly: true,
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}

/***********************************
 *         CSRF Protection         *
 ***********************************/
export const csrfProtection = csrf({ cookie: cookieOptions })

const onError: ErrorRequestHandler = (err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN')
    return res.status(400).send('Invalid CSRF token!')

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
   *         DB Connection &          *
   *        Express Sessions          *
   *        With Mongo Store          *
   ***********************************/
  configureExpressSession(app)

  app.use(express.json({ limit: '100mb' }))
  app.use(express.static(path.join(__dirname, '../public')))

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
