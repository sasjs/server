import express, { Express } from 'express'
import request from 'supertest'
import { configureSecurity } from '../configureSecurity'

/**
 * One express app serves both listeners, so the CSP decision has to follow the
 * request: the directive is right for a page over TLS and breaks one over plain
 * HTTP, where it rewrites the page's own http:// subresources.
 *
 * The decision is made from the listener configuration rather than `req.secure`,
 * because `secure` is only true behind a proxy when TRUST_PROXY is set.
 */
const buildApp = (): Express => {
  const app = express()

  configureSecurity(app)
  app.get('/probe', (_req, res) => res.status(200).send('ok'))

  return app
}

const cspOf = (res: request.Response): string =>
  String(res.headers['content-security-policy'] ?? '')

const ENV = [
  'HTTP_PORT',
  'HTTPS_PORT',
  'HTTP_BIND_ADDRESS',
  'HTTP_ALLOW_REMOTE',
  'CERT_CHAIN',
  'PRIVATE_KEY'
]

describe('configureSecurity', () => {
  const saved: NodeJS.ProcessEnv = {}

  beforeEach(() => {
    ENV.forEach((key) => {
      saved[key] = process.env[key]
      delete process.env[key]
    })
  })

  afterEach(() => {
    ENV.forEach((key) => {
      if (saved[key] === undefined) delete process.env[key]
      else process.env[key] = saved[key]
    })
  })

  it('should keep upgrade-insecure-requests when the process serves TLS', async () => {
    process.env.HTTPS_PORT = '443'
    process.env.CERT_CHAIN = './certs/fullchain.pem'
    process.env.PRIVATE_KEY = 'key'

    const res = await request(buildApp()).get('/probe')

    expect(res.status).toEqual(200)
    expect(cspOf(res)).toContain('upgrade-insecure-requests')
  })

  it('should keep the directive on a TLS deployment that has not set TRUST_PROXY', async () => {
    // the reason the decision does not use req.secure: behind a proxy that
    // terminates TLS, req.secure is false without TRUST_PROXY, and the directive
    // would be stripped from a deployment that is genuinely encrypted
    process.env.HTTP_PORT = '5000'
    process.env.HTTPS_PORT = '443'
    process.env.CERT_CHAIN = './certs/fullchain.pem'
    process.env.PRIVATE_KEY = 'key'

    const res = await request(buildApp()).get('/probe')

    expect(cspOf(res)).toContain('upgrade-insecure-requests')
  })

  it('should drop only that directive, keeping the ones around it', async () => {
    // a policy that lists a directive after upgrade-insecure-requests: a regex
    // spanning the separators would join default-src and script-src into one
    process.env.HTTP_PORT = '5000'
    process.env.HELMET_CSP_CONFIG_PATH = ''

    const res = await request(buildApp()).get('/probe')
    const policy = cspOf(res)

    expect(policy).not.toContain('upgrade-insecure-requests')
    expect(policy).toContain("default-src 'self'")
    expect(policy).toContain("script-src 'self'")
    // each directive stays its own, semicolon separated
    expect(policy.split(';').filter(Boolean).length).toBeGreaterThan(1)
  })

  it('should drop upgrade-insecure-requests when only a plain listener runs', async () => {
    process.env.HTTP_PORT = '5000'

    const res = await request(buildApp()).get('/probe')

    expect(res.status).toEqual(200)
    expect(cspOf(res)).not.toContain('upgrade-insecure-requests')
    // the rest of the policy survives
    expect(cspOf(res)).toContain("default-src 'self'")
  })
})
