import express from 'express'
import indexRouter from './routes'

const app = express()

app.use(express.json({ limit: '50mb' }))

app.use('/', indexRouter)

export default app
