import path from 'path'
import express, { ErrorRequestHandler } from 'express'
import csrf from 'csurf'
import session from 'express-session'
import MongoStore from 'connect-mongo'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import cors from 'cors'
import helmet from 'helmet'

import {
  connectDB,
  copySASjsCore,
  getWebBuildFolderPath,
  loadAppStreamConfig,
  setProcessVariables,
  setupFolders
} from './utils'

dotenv.config()

const app = express()

app.use(cookieParser())
app.use(morgan('tiny'))

const { MODE, CORS, WHITELIST, PROTOCOL, CSP_DISABLE } = process.env

export const cookieOptions = {
  secure: PROTOCOL === 'https',
  httpOnly: true,
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}

/***********************************
 *         CSRF Protection         *
 ***********************************/
export const csrfProtection = csrf({ cookie: cookieOptions })

/***********************************
 *   Handle security and origin    *
 ***********************************/
if (CSP_DISABLE !== 'true') {
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          'script-src': ["'self'", "'unsafe-inline'"]
        }
      }
    })
  )
}

/***********************************
 *         Enabling CORS           *
 ***********************************/
if (MODE?.trim() !== 'server' || CORS?.trim() === 'enable') {
  const whiteList: string[] = []
  WHITELIST?.split(' ')
    ?.filter((url) => !!url)
    .forEach((url) => {
      if (url.startsWith('http'))
        // removing trailing slash of URLs listing for CORS
        whiteList.push(url.replace(/\/$/, ''))
    })

  console.log('All CORS Requests are enabled for:', whiteList)
  app.use(cors({ credentials: true, origin: whiteList }))
}

/***********************************
 *         DB Connection &          *
 *        Express Sessions          *
 *        With Mongo Store          *
 ***********************************/
if (MODE?.trim() === 'server') {
  // NOTE: when exporting app.js as agent for supertest
  // we should exclude connecting to the real database
  if (process.env.NODE_ENV !== 'test') {
    const clientPromise = connectDB().then((conn) => conn!.getClient() as any)

    app.use(
      session({
        secret: process.env.SESSION_SECRET as string,
        saveUninitialized: false, // don't create session until something stored
        resave: false, //don't save session if unmodified
        store: MongoStore.create({ clientPromise, collectionName: 'sessions' }),
        cookie: cookieOptions
      })
    )
  }
}
app.use(express.json({ limit: '100mb' }))
app.use(express.static(path.join(__dirname, '../public')))

const onError: ErrorRequestHandler = (err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN')
    return res.status(400).send('Invalid CSRF token!')

  console.error(err.stack)
  res.status(500).send('Something broke!')
}

export default setProcessVariables().then(async () => {
  await setupFolders()
  await copySASjsCore()

  // loading these modules after setting up variables due to
  // multer's usage of process var process.driveLoc
  const { setupRoutes } = await import('./routes/setupRoutes')
  setupRoutes(app)

  await loadAppStreamConfig()

  // should be served after setting up web route
  // index.html needs to be injected with some js script.
  app.use(express.static(getWebBuildFolderPath()))

  app.use(onError)

  return app
})
