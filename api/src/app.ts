import express from 'express'
import indexRouter from './routes'
import path from 'path'
import { getWebBuildFolderPath } from './utils'
const app = express()

app.use(express.json({ limit: '50mb' }))
app.use('/', indexRouter)
app.use(express.static(getWebBuildFolderPath()))

export default app
