import path from 'path'
import jwt from 'jsonwebtoken'
import express from 'express'
import passport from 'passport'
import { Strategy } from 'passport-local'
const AzureAdOAuth2Strategy = require('passport-azure-ad-oauth2')
import { ensureLoggedIn } from 'connect-ensure-login'
import { readFile } from '@sasjs/utils'

import { AuthMechanism } from './types'
import { getAuthMechanisms } from './utils'
import indexRouter, { Routes } from './routes'

export const passportMiddleware = (): express.Express => {
  const authMechanisms = getAuthMechanisms()

  const middleware = express()

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
    middleware.all('/*', indexRouter)
  } else {
    middleware.all(
      '/*',
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
      new Strategy(async (username: string, code: string, cb: Function) => {
        const content = await readFile(
          path.join(__dirname, '..', 'security.json')
        )
        const { code: securityCode } = JSON.parse(content)
        if (securityCode !== code)
          return cb(null, false, { message: 'Incorrect Security Code' })

        const user = {
          id: 'SOMEID',
          username: username,
          displayName: username
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
          const decoded = jwt.decode(params.id_token)

          const user = {
            id: 'ID',
            username: 'username',
            displayName: 'display name'
          }
          if (decoded && typeof decoded === 'object') {
            user.id = decoded.oid
            user.username = decoded.unique_name
            user.displayName = decoded.name
          }

          done(null, user)
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
        failureRedirect: Routes.Login,
        failureMessage: true
      }),
      (req, res) => {
        const session: any = req.session
        const returnTo = session.returnTo ?? '/'
        session.returnTo = undefined
        res.redirect(returnTo)
      }
    )
  }
  if (authMechanisms.includes(AuthMechanism.Local)) {
    app.post(
      Routes.LocalSignIn,
      passport.authenticate('local', {
        failureRedirect: Routes.Login,
        failureMessage: true
      }),
      (req, res) => {
        const session: any = req.session
        const returnTo = session.returnTo ?? '/'
        session.returnTo = undefined
        res.redirect(returnTo)
      }
    )
  }
}
