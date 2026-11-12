import express, { Express } from 'express'
import request from 'supertest'

import { configureCors } from '../configureCors'
import { CorsType, ModeType } from '../../utils'

/**
 * WHITELIST decides which browser origins receive an
 * Access-Control-Allow-Origin header, so these tests read that header off a real
 * response rather than the array the module builds: an entry the middleware
 * cannot match is the failure worth catching, and only the header shows it.
 */
const buildApp = (): Express => {
  const app = express()

  configureCors(app)
  app.get('/probe', (_req, res) => res.status(200).send('ok'))

  return app
}

const allowOriginOf = (res: request.Response): string =>
  String(res.headers['access-control-allow-origin'] ?? '')

describe('configureCors', () => {
  const originalEnv = { ...process.env }

  beforeAll(() => {
    // the module logs the list it registered, and the unit suite has no logger
    process.logger = { info: jest.fn() } as any
  })

  beforeEach(() => {
    process.env.CORS = CorsType.ENABLED
    delete process.env.WHITELIST
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('answers a space separated list', async () => {
    process.env.WHITELIST = 'http://one.example.com http://two.example.com'

    const res = await request(buildApp())
      .get('/probe')
      .set('Origin', 'http://two.example.com')
      .expect(200)

    expect(allowOriginOf(res)).toBe('http://two.example.com')
  })

  it('answers every origin of a comma separated list', async () => {
    process.env.WHITELIST = 'http://one.example.com,http://two.example.com'

    const first = await request(buildApp())
      .get('/probe')
      .set('Origin', 'http://one.example.com')
      .expect(200)
    const second = await request(buildApp())
      .get('/probe')
      .set('Origin', 'http://two.example.com')
      .expect(200)

    expect(allowOriginOf(first)).toBe('http://one.example.com')
    expect(allowOriginOf(second)).toBe('http://two.example.com')
  })

  it('ignores a trailing slash on a listed origin', async () => {
    process.env.WHITELIST = 'http://one.example.com/'

    const res = await request(buildApp())
      .get('/probe')
      .set('Origin', 'http://one.example.com')
      .expect(200)

    expect(allowOriginOf(res)).toBe('http://one.example.com')
  })

  it('does not answer an origin that is not on the list', async () => {
    process.env.WHITELIST = 'http://one.example.com'

    const res = await request(buildApp())
      .get('/probe')
      .set('Origin', 'http://elsewhere.example.com')
      .expect(200)

    expect(allowOriginOf(res)).toBe('')
  })

  it('does not answer anything when CORS is not enabled', async () => {
    process.env.CORS = CorsType.DISABLED
    process.env.WHITELIST = 'http://one.example.com'

    const res = await request(buildApp())
      .get('/probe')
      .set('Origin', 'http://one.example.com')
      .expect(200)

    expect(allowOriginOf(res)).toBe('')
  })

  // With CORS unset the mode is the one derived for the deployment, and a
  // desktop install is the deployment that never writes the variable - so these
  // two cases pin what the derived default decides, in both directions.
  it('answers by default on a desktop install, where CORS is unset', async () => {
    process.env.MODE = ModeType.Desktop
    delete process.env.CORS
    process.env.WHITELIST = 'http://one.example.com'

    const res = await request(buildApp())
      .get('/probe')
      .set('Origin', 'http://one.example.com')
      .expect(200)

    expect(allowOriginOf(res)).toBe('http://one.example.com')
  })

  it('answers nothing by default on a server install, where CORS is unset', async () => {
    process.env.MODE = ModeType.Server
    delete process.env.CORS
    process.env.WHITELIST = 'http://one.example.com'

    const res = await request(buildApp())
      .get('/probe')
      .set('Origin', 'http://one.example.com')
      .expect(200)

    expect(allowOriginOf(res)).toBe('')
  })
})
