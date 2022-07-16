import { Express } from 'express'
import mongoose from 'mongoose'
import session from 'express-session'
import MongoStore from 'connect-mongo'

import { ModeType } from '../utils'
import { cookieOptions } from '../app'

export const configureExpressSession = (app: Express) => {
  const { MODE } = process.env

  if (MODE === ModeType.Server) {
    let store: MongoStore | undefined

    if (process.env.NODE_ENV !== 'test') {
      store = MongoStore.create({
        client: mongoose.connection!.getClient() as any,
        collectionName: 'sessions'
      })
    }

    app.use(
      session({
        secret: process.secrets.SESSION_SECRET,
        saveUninitialized: false, // don't create session until something stored
        resave: false, //don't save session if unmodified
        store,
        cookie: cookieOptions
      })
    )
  }
}
