import './sessionCookieEnv'
import { Express } from 'express'
import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'
import appPromise from '../../../app'

/**
 * The session cookie must be marked Secure on a site whose TLS terminates at a
 * proxy. The app itself receives plain HTTP there, so a static
 * `PROTOCOL === 'https'` check cannot see the client's protocol - the flag has
 * to follow X-Forwarded-Proto, which Express only believes once TRUST_PROXY is
 * set (sessionCookieEnv.ts sets it before the app is built).
 *
 * The assertions read the cookie set when the SESSION IS CREATED, because that
 * is when express-session decides the Secure flag: a session first seen over
 * plain HTTP stays non-Secure for its lifetime. Requesting `/` mints one (the
 * CSRF secret is stored on the session).
 */
describe('session cookie flags behind a TLS-terminating proxy', () => {
  let app: Express
  let con: Mongoose
  let mongoServer: MongoMemoryServer

  const sessionCookieOf = (res: request.Response): string => {
    const cookies = (res.headers['set-cookie'] as unknown as string[]) || []

    return cookies.find((cookie) => cookie.startsWith('connect.sid=')) || ''
  }

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create()
    con = await mongoose.connect(mongoServer.getUri())
    app = await appPromise
  })

  afterAll(async () => {
    await con.disconnect()
    await mongoServer.stop()
  })

  it('marks the cookie Secure when the proxy reports https', async () => {
    const res = await request(app)
      .get('/')
      .set('X-Forwarded-Proto', 'https')
      .expect(200)

    const sessionCookie = sessionCookieOf(res)
    expect(sessionCookie).not.toEqual('')
    expect(sessionCookie).toContain('Secure')
    expect(sessionCookie).toContain('HttpOnly')
    expect(sessionCookie).toContain('SameSite=Lax')
  })

  it('leaves the cookie without Secure when the request arrives over http', async () => {
    const res = await request(app).get('/').expect(200)

    const sessionCookie = sessionCookieOf(res)
    expect(sessionCookie).not.toEqual('')
    expect(sessionCookie).not.toContain('Secure')
    expect(sessionCookie).toContain('HttpOnly')
    expect(sessionCookie).toContain('SameSite=Lax')
  })

  it('honours the X-Forwarded-Proto the proxy actually sends', async () => {
    // A proxy that reports http (an internal health check, a plain-HTTP
    // deployment) must not have its cookie marked Secure.
    const res = await request(app)
      .get('/')
      .set('X-Forwarded-Proto', 'http')
      .expect(200)

    expect(sessionCookieOf(res)).not.toContain('Secure')
  })

  /**
   * The session cookie and the CSRF cookie are used as a pair: a token is only
   * valid against the session that minted it, so a client holding one without
   * the other gets `400 Invalid CSRF token!` on every state-changing request,
   * the first login included. Both must therefore state the same lifetime, in
   * the same attributes - express-session would otherwise write `Expires` only
   * while the CSRF cookie carries `Max-Age` too.
   */
  describe('lifetime of the cookie pair', () => {
    const cookieOf = (res: request.Response, name: string): string => {
      const cookies = (res.headers['set-cookie'] as unknown as string[]) || []

      return cookies.find((cookie) => cookie.startsWith(`${name}=`)) || ''
    }

    it('issues both cookies with Max-Age and Expires', async () => {
      const res = await request(app)
        .get('/')
        .set('X-Forwarded-Proto', 'https')
        .expect(200)

      const sessionCookie = sessionCookieOf(res)
      const csrfCookie = cookieOf(res, 'XSRF-TOKEN')

      expect(sessionCookie).not.toEqual('')
      expect(csrfCookie).not.toEqual('')
      expect(sessionCookie).toContain('Max-Age=86400')
      expect(sessionCookie).toContain('Expires=')
      expect(csrfCookie).toContain('Max-Age=86400')
      expect(csrfCookie).toContain('Expires=')
    })

    it('gives both cookies the same Max-Age', async () => {
      const res = await request(app).get('/').expect(200)

      const maxAgeOf = (cookie: string) =>
        (cookie.match(/Max-Age=(\d+)/) || [])[1]

      expect(maxAgeOf(sessionCookieOf(res))).toBeDefined()
      expect(maxAgeOf(sessionCookieOf(res))).toEqual(
        maxAgeOf(cookieOf(res, 'XSRF-TOKEN'))
      )
    })

    it('keeps the pair usable when the token is reissued', async () => {
      // A second visit re-mints the CSRF cookie against the session the client
      // already has. The new token has to be accepted with that session - a
      // token the server refuses here is the `Invalid CSRF token!` that blocks
      // the login screen.
      const first = await request(app).get('/').expect(200)
      const sessionCookie = sessionCookieOf(first).split(';')[0]

      const second = await request(app)
        .get('/')
        .set('Cookie', sessionCookie)
        .expect(200)

      const token = (cookieOf(second, 'XSRF-TOKEN').match(
        /XSRF-TOKEN=([^;]+)/
      ) || [])[1]

      expect(token).toBeDefined()

      const login = await request(app)
        .post('/SASLogon/login')
        .set('Cookie', sessionCookie)
        .set('X-XSRF-TOKEN', token as string)
        .send({ username: 'nosuchuser', password: 'notapassword' })

      // 401 is the CSRF check passing and the credential failing, which is
      // what this asserts; 400 would be the token being refused.
      expect(login.status).toBe(401)
    })

    it('serializes Max-Age on the cookie of a regenerated session', async () => {
      // Logout replaces the session, so the cookie on that response is built
      // after anything a request middleware would have run. The pair has to
      // stay consistent there too, or the next login meets the same refusal.
      const primed = await request(app).get('/').expect(200)
      const sessionCookie = sessionCookieOf(primed).split(';')[0]

      const logout = await request(app)
        .get('/SASLogon/logout')
        .set('Cookie', sessionCookie)
        .expect(200)

      const regenerated = sessionCookieOf(logout)

      expect(regenerated).not.toEqual('')
      expect(regenerated).toContain('Max-Age=86400')
    })
  })
})
