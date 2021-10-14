import express from 'express'
import indexRouter from './routes'
import path from 'path'
const app = express()

app.use(express.json({ limit: '50mb' }))
app.use('/', indexRouter)
app.use(express.static(path.join(__dirname, '..', 'Web', 'build')))

export default app
