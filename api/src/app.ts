import path from 'path'
import express, { ErrorRequestHandler } from 'express'
import session from 'express-session'
import MongoStore from 'connect-mongo'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import cors from 'cors'

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

const { MODE, CORS, WHITELIST } = process.env

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

if (MODE?.trim() === 'server') {
  const clientPromise = connectDB().then((conn) => conn!.getClient() as any)

  const { PROTOCOL } = process.env

  app.use(
    session({
      secret: process.env.SESSION_SECRET as string,
      saveUninitialized: false, // don't create session until something stored
      resave: false, //don't save session if unmodified
      store: MongoStore.create({ clientPromise, collectionName: 'sessions' }),
      cookie: {
        secure: PROTOCOL === 'https',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      }
    })
  )
}

app.use(cookieParser())
app.use(morgan('tiny'))
app.use(express.json({ limit: '100mb' }))
app.use(express.static(path.join(__dirname, '../public')))

const onError: ErrorRequestHandler = (err, req, res, next) => {
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
