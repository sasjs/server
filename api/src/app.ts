import path from 'path'
import express from 'express'
import morgan from 'morgan'
import dotenv from 'dotenv'
import cors from 'cors'

import webRouter from './routes/web'
import apiRouter from './routes/api'
import { connectDB, getWebBuildFolderPath } from './utils'

import { FolderController } from './controllers'

dotenv.config()

const app = express()

const { MODE, CORS, PORT_WEB } = process.env
if (MODE?.trim() !== 'server' || CORS?.trim() === 'enable') {
  console.log('All CORS Requests are enabled')
  app.use(
    cors({ credentials: true, origin: `http://localhost:${PORT_WEB ?? 3000}` })
  )
}

app.use(express.json({ limit: '50mb' }))
app.use(morgan('tiny'))
app.use(express.static(path.join(__dirname, '../public')))

app.use('/', webRouter)
app.use('/SASjsApi', apiRouter)
app.use(express.json({ limit: '50mb' }))

app.use(express.static(getWebBuildFolderPath()))

const folderController = new FolderController()

folderController.addRootFolder()

export default connectDB().then(() => app)
