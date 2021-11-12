import path from 'path'
import express from 'express'
import morgan from 'morgan'
import dotenv from 'dotenv'

import webRouter from './routes/web'
import apiRouter from './routes/api'
import { getWebBuildFolderPath } from './utils'
import { connectDB } from './routes/api/auth'

const app = express()

app.use(express.json({ limit: '50mb' }))
app.use(morgan('tiny'))
app.use(express.static(path.join(__dirname, '../public')))

app.use('/', webRouter)
app.use('/SASjsApi', apiRouter)
app.use(express.json({ limit: '50mb' }))

app.use(express.static(getWebBuildFolderPath()))

dotenv.config()

export default connectDB().then(() => app)
