import { Express } from 'express'

import webRouter from './web'
import apiRouter from './api'

export const setupRoutes = (app: Express) => {
  app.use('/', webRouter)
  app.use('/SASjsApi', apiRouter)
}
