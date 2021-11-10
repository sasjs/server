import express from 'express'
import webRouter from './routes/web'
import apiRouter from './routes/api'
import { getWebBuildFolderPath } from './utils'

const app = express()
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000')
  res.header('Access-Control-Allow-Credentials', 'true')
  next()
})

app.use(express.json({ limit: '50mb' }))
app.use(express.static(getWebBuildFolderPath()))
app.use('/', webRouter)
app.use('/SASjsApi', apiRouter)

export default app
