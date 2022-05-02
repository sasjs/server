import { Express } from 'express'

import webRouter from './web'
import apiRouter from './api'
import appStreamRouter from './appStream'

import { csrfProtection } from '../app'

export const setupRoutes = (app: Express) => {
  app.use('/SASjsApi', apiRouter)

  app.use('/AppStream', csrfProtection, function (req, res, next) {
    // this needs to be a function to hook on
    // whatever the current router is
    appStreamRouter(req, res, next)
  })

  app.use('/', csrfProtection, webRouter)
}
