import express from 'express'
import session from 'express-session'
import indexRouter from '../routes'

export const getAzureSubApp = () => {
  console.log('Using Azure Authentication')
  const app = express()

  const msalWrapper = require('msal-express-wrapper')
  const appSettings = {
    appCredentials: {
      clientId: process.env.CLIENTID ?? ' ',
      tenantId: process.env.TENANTID ?? ' ',
      clientSecret: process.env.CLIENTSECRET ?? ' '
    },
    authRoutes: {
      redirect: '/redirect',
      error: '/error', // the wrapper will redirect to this route in case of any error.
      unauthorized: '/unauthorized' // the wrapper will redirect to this route in case of unauthorized access attempt.
    }
  }

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
  app.get('/signin-with-azure', authProvider.signIn({ successRedirect: '/' }))
  app.get('/signout-with-azure', authProvider.signOut({ successRedirect: '/' }))

  // secure routes
  app.get('/', authProvider.isAuthenticated(), indexRouter)

  return app
}
