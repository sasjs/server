import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import express from 'express'
import session from 'express-session'
import passport from 'passport'
import { Strategy } from 'passport-local'
const AzureAdOAuth2Strategy = require('passport-azure-ad-oauth2')
import { ensureLoggedIn } from 'connect-ensure-login'
import { AuthMechanism } from './types'
import { getAuthMechanisms } from './utils'
import indexRouter, { Routes } from './routes'

export const passportMiddleware = (): express.Express => {
  dotenv.config()
  const authMechanisms = getAuthMechanisms()

  const middleware = express()

  const sessionConfig = {
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false // set this to true on production
    }
  }

  if (middleware.get('env') === 'production') {
    middleware.set('trust proxy', 1) // trust first proxy
    sessionConfig.cookie.secure = true // serve secure cookies
  }

  middleware.use(session(sessionConfig))

  setupPassportStrategies(authMechanisms)

  middleware.use(passport.initialize())
  middleware.use(passport.authenticate('session'))

  setupPassportRoutes(middleware, authMechanisms)

  middleware.get('/signout', (req, res, next) => {
    req.logout()
    res.redirect('/')
  })

  if (
    authMechanisms.length === 1 &&
    authMechanisms[0] === AuthMechanism.NoSecurity
  ) {
    console.log('Using No Security')
    middleware.get('/', indexRouter)
  } else {
    middleware.get(
      '/',
      ensureLoggedIn({ redirectTo: '/SASjsLogon' }),
      indexRouter
    )
  }

  return middleware
}

const setupPassportStrategies = (authMechanisms: string[]) => {
  if (authMechanisms.includes(AuthMechanism.Local)) {
    console.log('Using Local Authentication')
    passport.use(
      new Strategy((username: string, password: string, cb: Function) => {
        console.log('username', username)
        if (username !== 'SaadJutt')
          return cb(null, false, { message: 'Incorrect Username' })

        const user = {
          id: 'SOMEID',
          username: username,
          displayName: 'displayName'
        }
        return cb(null, user)
      })
    )
  }
  if (authMechanisms.includes(AuthMechanism.Azure)) {
    console.log('Using Azure Authentication')
    passport.use(
      new AzureAdOAuth2Strategy(
        {
          clientID: process.env.CLIENTID as string,
          clientSecret: process.env.CLIENTSECRET as string,
          callbackURL: '/redirect'
        },
        function (
          accessToken: any,
          refresh_token: any,
          params: any,
          profile: any,
          done: any
        ) {
          // currently we can't find a way to exchange access token by user info (see userProfile implementation), so
          // you will need a jwt-package like https://github.com/auth0/node-jsonwebtoken to decode id_token and get waad profile
          var waadProfile = profile || jwt.decode(params.id_token)

          done(null, { id: waadProfile.upn })
        }
      )
    )
  }

  passport.serializeUser((user: any, cb) => {
    process.nextTick(() => {
      cb(null, { id: user.id, username: user.username })
    })
  })

  passport.deserializeUser((user: any, cb) => {
    process.nextTick(() => {
      return cb(null, user)
    })
  })
}

const setupPassportRoutes = (
  app: express.Express,
  authMechanisms: string[]
) => {
  if (authMechanisms.includes(AuthMechanism.Azure)) {
    app.get(Routes.AzureSignIn, passport.authenticate(['azure_ad_oauth2']))
    app.get(
      Routes.AzureSignInRedirect,
      passport.authenticate('azure_ad_oauth2', {
        successRedirect: '/',
        failureRedirect: Routes.Login,
        failureMessage: true
      })
    )
  }
  if (authMechanisms.includes(AuthMechanism.Local)) {
    app.post(
      Routes.LocalSignIn,
      passport.authenticate(['local'], {
        successRedirect: '/',
        failureRedirect: Routes.Login,
        failureMessage: true
      })
    )
  }
}
