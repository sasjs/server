import path from 'path'
import express, { ErrorRequestHandler } from 'express'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import cors from 'cors'

import {
  connectDB,
  getWebBuildFolderPath,
  sasJSCoreMacros,
  setProcessVariables
} from './utils'

dotenv.config()

const app = express()

const { MODE, CORS, WHITELIST } = process.env

if (MODE?.trim() !== 'server' || CORS?.trim() === 'enable') {
  const whiteList: string[] = []
  WHITELIST?.split(' ')?.forEach((url) => {
    if (url.startsWith('http')) whiteList.push(url)
  })

  console.log('All CORS Requests are enabled')
  app.use(cors({ credentials: true, origin: whiteList }))
}

app.use(cookieParser())
app.use(morgan('tiny'))
app.use(express.json({ limit: '50mb' }))
app.use(express.static(path.join(__dirname, '../public')))

const onError: ErrorRequestHandler = (err, req, res, next) => {
  console.error(err.stack)
  res.status(500).send('Something broke!')
}

export default setProcessVariables().then(async () => {
  // loading these modules after setting up variables due to
  // multer's usage of process var process.driveLoc
  const { setupRoutes } = await import('./routes/setupRoutes')
  setupRoutes(app)

  // should be served after setting up web route
  // index.html needs to be injected with some js script.
  app.use(express.static(getWebBuildFolderPath()))

  console.log('sasJSCoreMacros', sasJSCoreMacros)

  app.use(onError)

  await connectDB()
  return app
})
