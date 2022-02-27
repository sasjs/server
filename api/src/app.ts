import path from 'path'
import express from 'express'
import morgan from 'morgan'
import dotenv from 'dotenv'
import cors from 'cors'

import { connectDB, getWebBuildFolderPath, setProcessVariables } from './utils'

dotenv.config()

const app = express()

const { MODE, CORS, PORT_WEB } = process.env
const whiteList = [
  `http://localhost:${PORT_WEB ?? 3000}`,
  'https://sas.analytium.co.uk:8343'
]

if (MODE?.trim() !== 'server' || CORS?.trim() === 'enable') {
  console.log('All CORS Requests are enabled')
  app.use(cors({ credentials: true, origin: whiteList }))
}

app.use(express.json({ limit: '50mb' }))
app.use(morgan('tiny'))
app.use(express.static(path.join(__dirname, '../public')))
app.use(express.static(getWebBuildFolderPath()))

export default setProcessVariables().then(async () => {
  // loading these modules after setting up variables due to
  // multer's usage of process var process.driveLoc
  const { setupRoutes } = await import('./routes/setupRoutes')
  setupRoutes(app)

  await connectDB()
  return app
})
