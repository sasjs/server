import path from 'path'
import express from 'express'
import { renderFile } from 'ejs'
import dotenv from 'dotenv'

import { Routes } from './routes'
import { passportMiddleware } from './middleware'
import { getAuthMechanisms } from './utils'
import { AuthMechanism } from './types'
import session from 'express-session'

dotenv.config()
const authMechanisms = getAuthMechanisms()

const app = express()

app.use(express.urlencoded({ extended: false }))
app.engine('html', renderFile)
app.set('view engine', 'html')
app.set('views', path.join(__dirname, './views'))

app.use(express.json({ limit: '50mb' }))
app.use(express.static(path.join(__dirname, '..', 'public')))

const sessionConfig = {
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false // set this to true on production
  }
}

if (app.get('env') === 'production') {
  app.set('trust proxy', 1) // trust first proxy
  sessionConfig.cookie.secure = true // serve secure cookies
}

app.use(session(sessionConfig))

app.get(Routes.Login, (req, res) => {
  if (
    authMechanisms.length === 1 &&
    authMechanisms[0] === AuthMechanism.NoSecurity
  ) {
    res.redirect('/')
  } else {
    const session: any = req.session
    const isAuthenticated = !!session?.passport?.user

    if (isAuthenticated) {
      res.redirect('/')
    } else {
      res.render('sasjslogon.html', { authMechanisms })
    }
  }
})

app.use(passportMiddleware())

app.get('/error', (req, res) => res.redirect('/500.html'))
app.get('/unauthorized', (req, res) => res.redirect('/401.html'))
// app.get('*', (req, res) => res.status(404).redirect('/404.html'))

export default app
