import express from 'express'
import morgan from 'morgan'
import webRouter from './routes/web'
import apiRouter from './routes/api'

const app = express()

app.use(express.json({ limit: '50mb' }))
app.use(morgan('tiny'))
app.use(express.static('public'))

app.use('/', webRouter)
app.use('/SASjsApi', apiRouter)

export default app
