import express from 'express'
import webRouter from './routes/web/web'
import apiRouter from './routes/api/'

const app = express()

app.use(express.json({ limit: '50mb' }))

app.use('/', webRouter)
app.use('/SASjsApi', apiRouter)

export default app
