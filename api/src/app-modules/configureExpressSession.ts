import { Express, CookieOptions } from 'express'
import mongoose from 'mongoose'
import session from 'express-session'
import MongoStore from 'connect-mongo'

import { DatabaseType, ModeType, ProtocolType } from '../utils'

export const configureExpressSession = (app: Express) => {
  const { MODE, DB_TYPE } = process.env

  if (MODE === ModeType.Server) {
    let store: MongoStore | undefined

    if (process.env.NODE_ENV !== 'test') {
      if (DB_TYPE === DatabaseType.COSMOS_MONGODB) {
        // COSMOS DB requires specific connection options (compatibility mode)
        // See: https://www.npmjs.com/package/connect-mongo#set-the-compatibility-mode
        store = MongoStore.create({
          client: mongoose.connection!.getClient() as any,
          autoRemove: 'interval'
        })
      } else {
        store = MongoStore.create({
          client: mongoose.connection!.getClient() as any
        })
      }
    }

    const { PROTOCOL, ALLOWED_DOMAIN } = process.env
    const cookieOptions: CookieOptions = {
      // 'auto' follows the connection's security, which respects
      // X-Forwarded-Proto once TRUST_PROXY is configured (see app.ts). A
      // static PROTOCOL === 'https' check cannot see it: behind a
      // TLS-terminating proxy the app itself always receives plain HTTP, so
      // the cookie was issued without Secure on an HTTPS site.
      //
      // The cast widens a stale type: @types/express-session declares `secure`
      // as boolean, while express-session 1.19 accepts 'auto' at runtime.
      secure: 'auto' as unknown as boolean,
      httpOnly: true,
      // 'none' is required ONLY when the app is embedded in a third-party
      // iframe (AppStream in an external portal), and it disables the
      // browser-level CSRF defence (the session cookie is then sent on
      // cross-site requests, leaving only the per-session token check).
      // Default to 'lax' - full same-origin protection with top-level
      // navigation still working - unless the operator opts into embedding
      // with SESSION_SAMESITE=none. Stated explicitly rather than left to the
      // browser's own default.
      sameSite: process.env.SESSION_SAMESITE === 'none' ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      domain: ALLOWED_DOMAIN?.trim() || undefined
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
