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
})
