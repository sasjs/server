import express from 'express'
import indexRouter from './routes'
import path from 'path'
const app = express()

app.use(express.json({ limit: '50mb' }))

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')

app.use(express.static(path.join(__dirname, '..', 'public')))
app.use('/', indexRouter)

export default app
