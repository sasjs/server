import express, { Express } from 'express'
import request from 'supertest'
import { configureSecurity } from '../configureSecurity'

/**
 * One express app serves both listeners, so the CSP decision has to follow the
 * request: the directive is right for a page over TLS and breaks one over plain
 * HTTP, where it rewrites the page's own http:// subresources.
 */
const buildApp = (): Express => {
  const app = express()

  configureSecurity(app)
  app.get('/probe', (_req, res) => res.status(200).send('ok'))

  return app
}

const cspOf = (res: request.Response): string =>
  String(res.headers['content-security-policy'] ?? '')

describe('configureSecurity', () => {
  it('should keep upgrade-insecure-requests for a request that arrived over TLS', async () => {
    const app = buildApp()
    // the app itself sees plain HTTP behind the proxy; trust proxy is what makes
    // req.secure follow X-Forwarded-Proto (see app.ts)
    app.set('trust proxy', 1)

    const res = await request(app)
      .get('/probe')
      .set('X-Forwarded-Proto', 'https')

    expect(res.status).toEqual(200)
    expect(cspOf(res)).toContain('upgrade-insecure-requests')
  })

  it('should drop upgrade-insecure-requests for a request that arrived over plain HTTP', async () => {
    const app = buildApp()

    const res = await request(app).get('/probe')

    expect(res.status).toEqual(200)
    expect(cspOf(res)).not.toContain('upgrade-insecure-requests')
    // the rest of the policy survives
    expect(cspOf(res)).toContain("default-src 'self'")
  })
})
