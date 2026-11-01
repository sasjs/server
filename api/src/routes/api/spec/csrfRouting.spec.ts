import { Express } from 'express'
import request from 'supertest'
import appPromise from '../../../app'
import { ModeType } from '../../../utils'

/**
 * A path nothing claims is a 404, not a refused CSRF check (sasjs/server#495).
 *
 * The check hung off the web router's mount, so it ran before any route was
 * matched: a POST to a path no route claims came back 400 'Invalid CSRF token!'
 * - the same answer as a real request with a stale token. A caller reading that
 * response cannot tell a typo in the URL from a token problem, and a frontend
 * developer reading it sees a CSRF error for a URL that simply does not exist.
 *
 * The check stays on in desktop mode. It is the only cross-site defence that
 * mode has - authenticateToken hands every request the fixed local user without
 * asking for a credential, which is exactly what makes the session-bound token
 * load bearing: without it, any page the user's browser has open can drive a
 * POST at the local server. Fixing the 404-versus-400 confusion does not need
 * the check dropped, so it is kept.
 */
describe('CSRF and routing order', () => {
  let app: Express
  const mode = process.env.MODE

  beforeAll(async () => {
    app = await appPromise
  })

  afterEach(() => {
    process.env.MODE = mode
  })

  describe('server mode', () => {
    beforeEach(() => {
      process.env.MODE = ModeType.Server
    })

    it('answers a POST to an unclaimed path with 404', async () => {
      const response = await request(app)
        .post('/NotAWebRoute')
        .send({ anything: true })

      expect(response.status).toBe(404)
      expect(response.text).not.toContain('Invalid CSRF token!')
    })

    it('still refuses a state-changing request that carries no token', async () => {
      const response = await request(app)
        .post('/SASLogon/login')
        .send({ username: 'someone', password: 'something' })

      expect(response.status).toBe(400)
      expect(response.text).toContain('Invalid CSRF token!')
    })
  })

  describe('desktop mode', () => {
    beforeEach(() => {
      process.env.MODE = ModeType.Desktop
    })

    it('answers a POST to an unclaimed path with 404', async () => {
      const response = await request(app)
        .post('/NotAWebRoute')
        .send({ anything: true })

      expect(response.status).toBe(404)
    })

    it('still refuses a login that carries no token', async () => {
      const response = await request(app)
        .post('/SASLogon/login')
        .send({ username: 'someone', password: 'something' })

      expect(response.status).toBe(400)
      expect(response.text).toContain('Invalid CSRF token!')
    })
  })
})
