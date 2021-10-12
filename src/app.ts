import path from 'path'
import express from 'express'
import session from 'express-session'

// import msalWrapper from 'msal-express-wrapper'
const msalWrapper = require('msal-express-wrapper')

import indexRouter from './routes'

require('dotenv').config()
import { appSettings } from './appSettings'

const app = express()

app.use(express.json({ limit: '50mb' }))

app.use(express.static(path.join(__dirname, '..', 'public')))

/**
 * Using express-session middleware. Be sure to familiarize yourself with available options
 * and set them as desired. Visit: https://www.npmjs.com/package/express-session
 */
const sessionConfig = {
  secret: appSettings.appCredentials.clientSecret,
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

// instantiate the wrapper
const authProvider = new msalWrapper.AuthProvider(appSettings)

// initialize the wrapper
app.use(authProvider.initialize())

// authentication routes
app.get('/signin', authProvider.signIn({ successRedirect: '/' }))
app.get('/signout', authProvider.signOut({ successRedirect: '/' }))

// secure routes
app.get('/', authProvider.isAuthenticated(), indexRouter)

app.get('/error', (req, res) => res.redirect('/500.html'))
app.get('/unauthorized', (req, res) => res.redirect('/401.html'))
app.get('*', (req, res) => res.status(404).redirect('/404.html'))

export default app
