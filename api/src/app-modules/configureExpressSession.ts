import { Express, CookieOptions } from 'express'
import mongoose from 'mongoose'
import session from 'express-session'
import MongoStore from 'connect-mongo'

import { ModeType, ProtocolType } from '../utils'

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

    const { PROTOCOL } = process.env
    const cookieOptions: CookieOptions = {
      secure: PROTOCOL === ProtocolType.HTTPS,
      httpOnly: true,
      sameSite: PROTOCOL === ProtocolType.HTTPS ? 'none' : undefined,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      domain: 'sas.4gl.io'
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
