import path from 'path'
import express from 'express'
import { renderFile } from 'ejs'

import { Routes } from './routes'
import { passportMiddleware } from './middleware'
import { getAuthMechanisms } from './utils'

const app = express()

app.use(express.urlencoded({ extended: false }))
app.engine('html', renderFile)
app.set('view engine', 'html')
app.set('views', path.join(__dirname, './views'))

app.use(express.json({ limit: '50mb' }))
app.use(express.static(path.join(__dirname, '..', 'public')))

app.use(passportMiddleware())

const authMechanisms = getAuthMechanisms()
app.get(Routes.Login, (req, res) => {
  res.render('sasjslogon.html', { authMechanisms })
})
app.get('/error', (req, res) => res.redirect('/500.html'))
app.get('/unauthorized', (req, res) => res.redirect('/401.html'))
app.get('*', (req, res) => res.status(404).redirect('/404.html'))

export default app
