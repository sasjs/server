import { Express } from 'express'
import request from 'supertest'

/**
 * The app shell catch-all.
 *
 * The interface's own screens are real paths, so the server answers a deep link
 * or a refresh with the app shell rather than a 404. Everything that is not one
 * of those - an API path, an app, an asset - has to keep its own answer, which
 * is what this pins.
 *
 * The web controller is mocked so the test controls whether a build is present;
 * without it the shell path would depend on `npm run web:copy` having run.
 */
const mockHome = jest.fn()

jest.mock('../../../controllers/web', () => ({
  WebController: jest.fn().mockImplementation(() => ({ home: mockHome }))
}))

import appPromise from '../../../app'

const SHELL = '<!doctype html><html><body>app shell</body></html>'

describe('the app shell catch-all', () => {
  let app: Express

  beforeAll(async () => {
    app = await appPromise
  })

  beforeEach(() => {
    mockHome.mockReset()
    mockHome.mockResolvedValue(SHELL)
  })

  it('should serve the shell for one of the interface routes', async () => {
    const res = await request(app)
      .get('/SASjsStudio')
      .set('Accept', 'text/html')
      .expect(200)

    expect(res.text).toEqual(SHELL)
  })

  it('should serve the shell for a route it does not know, so the router decides', async () => {
    // The interface's own catch-all route redirects home; the server does not
    // need to know which paths exist.
    await request(app)
      .get('/nested/deep/route')
      .set('Accept', 'text/html')
      .expect(200)
  })

  it('should hand back the CSRF token with the shell', async () => {
    // The web router's own shell route sets this cookie, so the catch-all does
    // too - otherwise a deep link depends on a second request for the token.
    const res = await request(app)
      .get('/SASjsStudio')
      .set('Accept', 'text/html')
      .expect(200)

    expect(String(res.headers['set-cookie'])).toContain('XSRF-TOKEN')
  })

  it('should refuse a reserved prefix whatever its case', async () => {
    // Express matches the mounted routers case-insensitively, so the refusal
    // has to be case-insensitive as well or /saslogon/unknown becomes the shell.
    for (const path of ['/SASLogon/unknown', '/saslogon/unknown']) {
      const res = await request(app)
        .get(path)
        .set('Accept', 'text/html')
        .expect(404)

      expect(res.text).toEqual('Not Found')
    }
  })

  it('should refuse a path that names a file', async () => {
    // An asset request answered with the shell turns a missing bundle into a
    // MIME error in the browser rather than a 404.
    await request(app)
      .get('/nonexistent.js')
      .set('Accept', 'text/html')
      .expect(404)
  })

  it('should refuse a request that does not accept HTML', async () => {
    await request(app)
      .get('/SASjsStudio')
      .set('Accept', 'application/json')
      .expect(404)
  })

  it('should refuse when there is no web build to serve', async () => {
    mockHome.mockRejectedValue(new Error('index.html is missing'))

    const res = await request(app)
      .get('/SASjsStudio')
      .set('Accept', 'text/html')
      .expect(404)

    expect(res.text).toEqual('Web Build is not present')
  })
})
