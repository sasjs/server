import path from 'path'
import express from 'express'

import morgan from 'morgan'
import webRouter from './routes/web'
import apiRouter from './routes/api'
import { getWebBuildFolderPath } from './utils'

const app = express()

app.use(express.json({ limit: '50mb' }))
app.use(morgan('tiny'))
app.use(express.static(path.join(__dirname, '../public')))

app.use('/', webRouter)
app.use('/SASjsApi', apiRouter)
app.use(express.json({ limit: '50mb' }))

app.use(express.static(getWebBuildFolderPath()))

export default app
