import path from 'path'
import express from 'express'

import indexRouter from './routes'
import { AuthMechanism } from './types'
import { getAzureSubApp } from './authMechanisms'

const app = express()
app.use(express.json({ limit: '50mb' }))
app.use(express.static(path.join(__dirname, '..', 'public')))

require('dotenv').config()

const authMechanisms = process.env.AUTH?.split(' ') ?? [
  AuthMechanism.NoSecurity
]

if (authMechanisms.includes(AuthMechanism.Azure)) {
  app.use(getAzureSubApp())
} else {
  app.get('/', indexRouter)
}

app.get('/error', (req, res) => res.redirect('/500.html'))
app.get('/unauthorized', (req, res) => res.redirect('/401.html'))
app.get('*', (req, res) => res.status(404).redirect('/404.html'))

export default app
