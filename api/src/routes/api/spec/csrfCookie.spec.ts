import { Express } from 'express'
import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'
import appPromise from '../../../app'
import { UserController } from '../../../controllers/'
import { generateAccessToken, saveTokensInDB } from '../../../utils/'

/**
 * The CSRF cookie's lifecycle (sasjs/server#304).
 *
 * The token is only valid against the session that minted it (the secret lives
 * on the session), and a browser keeps its cookie jar across a logout and
 * across a refused request. Left alone, the token that survives either event is
 * bound to a session the server no longer honours, so the next state-changing
 * request - a login, first of all - is refused with 'Invalid CSRF token!' and
 * there is no way out of it but a page reload.
 *
 * Before the fix every assertion in the first two specs failed: logout carried
 * no Set-Cookie at all, so the stale token was all the browser had.
 */

const clientId = 'someclientID'

const user = {
  displayName: 'Test User',
  username: 'csrfuser',
  password: '87654321',
  isAdmin: false,
  isActive: true
}

describe('CSRF cookie lifecycle', () => {
  let app: Express
  let con: Mongoose
  let mongoServer: MongoMemoryServer
  const userController = new UserController()

  const cookiesOf = (res: request.Response): string[] =>
    (res.headers['set-cookie'] as unknown as string[]) || []

  /** The token the response hands the browser, if it hands one over. */
  const csrfCookieOf = (res: request.Response): string | undefined =>
    /XSRF-TOKEN=([^;]*)/.exec(cookiesOf(res).join(';'))?.[1]

  beforeAll(async () => {
    app = await appPromise
    mongoServer = await MongoMemoryServer.create()
    con = await mongoose.connect(mongoServer.getUri())
    await userController.createUser(user)
  })

  afterAll(async () => {
    await con.connection.dropDatabase()
    await con.connection.close()
    await mongoServer.stop()
  })

  describe('logout replaces the token rather than leaving a stale one', () => {
    it('hands back a token bound to the new session', async () => {
      const agent = request.agent(app)
      const staleToken = csrfCookieOf(await agent.get('/'))
      expect(staleToken).toBeTruthy()

      await agent
        .post('/SASLogon/login')
        .set('x-xsrf-token', staleToken!)
        .send({ username: user.username, password: user.password })
        .expect(200)

      const logout = await agent.get('/SASLogon/logout').expect(200)

      // The client keeps its cookies across a logout, so the response is the
      // only chance to correct them without another round trip.
      const freshToken = csrfCookieOf(logout)
      expect(freshToken).toBeTruthy()
      expect(freshToken).not.toEqual(staleToken)

      // ...and the token that came back is immediately usable, which is what
      // #304 could not do.
      const relogin = await agent
        .post('/SASLogon/login')
        .set('x-xsrf-token', freshToken!)
        .send({ username: user.username, password: user.password })
        .expect(200)

      expect(relogin.body.loggedIn).toBe(true)
    })

    it('still refuses the token the logout replaced', async () => {
      const agent = request.agent(app)
      const staleToken = csrfCookieOf(await agent.get('/'))!

      await agent
        .post('/SASLogon/login')
        .set('x-xsrf-token', staleToken)
        .send({ username: user.username, password: user.password })
        .expect(200)

      await agent.get('/SASLogon/logout').expect(200)

      // Replaced, not merely kept: the old token is bound to the session the
      // logout discarded, so presenting it is still a mismatch.
      const res = await agent
        .post('/SASLogon/login')
        .set('x-xsrf-token', staleToken)
        .send({ username: user.username, password: user.password })

      expect(res.status).toBe(400)
      expect(res.text).toEqual('Invalid CSRF token!')
    })
  })

  describe('401 responses', () => {
    it('clears the cookie when the caller is not authenticated', async () => {
      const agent = request.agent(app)
      await agent.get('/')

      const res = await agent.get('/SASjsApi/session').expect(401)

      const cleared = cookiesOf(res).find((cookie) =>
        cookie.startsWith('XSRF-TOKEN=')
      )

      expect(cleared).toBeDefined()
      // An empty value with an expiry in the past is how a cookie is removed.
      expect(cleared).toMatch(/^XSRF-TOKEN=;/)
      expect(cleared).toMatch(/Expires=Thu, 01 Jan 1970/)
    })

    it('leaves the cookie alone when an authenticated caller lacks a grant', async () => {
      // authorize.ts refuses a caller who IS authenticated but has no grant on
      // the route. Their session and token are both valid, so clearing would
      // break the next request they legitimately make - which is why the
      // clearing is scoped to the unauthenticated 401s in authenticateToken.
      const dbUser = await userController.createUser({
        displayName: 'Ungranted User',
        username: 'ungranteduser',
        password: '87654321',
        isAdmin: false,
        isActive: true
      })

      const token = generateAccessToken({ clientId, userId: dbUser.uid })
      await saveTokensInDB(dbUser.uid, clientId, token, 'refreshToken')

      const res = await request(app)
        .get('/SASjsApi/drive/folder')
        .auth(token, { type: 'bearer' })
        .expect(401)

      expect(res.headers['set-cookie']).toBeUndefined()
    })
  })
})
