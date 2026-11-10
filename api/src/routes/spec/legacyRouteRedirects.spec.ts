import express, { Express } from 'express'
import request from 'supertest'

import { legacyRouteRedirects } from '../legacyRouteRedirects'

/**
 * The middleware on its own: an app that answers every GET with the app shell,
 * as the real server does, so a request that is NOT redirected proves it still
 * reaches the shell rather than a 404.
 */
const app: Express = express()
app.use(legacyRouteRedirects)
app.get('/*splat', (_req, res) => res.send('shell'))

describe('legacyRouteRedirects', () => {
  const moved: [string, string][] = [
    ['/SASjsStudio', '/studio'],
    ['/SASjsApps', '/apps'],
    ['/SASjsSettings', '/settings'],
    ['/SASjsLogon', '/logon'],
    ['/SASjsDocs', '/docs'],
    ['/SASjsApiDocs', '/api-assets/']
  ]

  it.each(moved)('redirects %s to %s', async (from, to) => {
    const response = await request(app).get(from)

    expect(response.status).toEqual(301)
    expect(response.headers.location).toEqual(to)
  })

  it('redirects a trailing slash too', async () => {
    const response = await request(app).get('/SASjsStudio/')

    expect(response.status).toEqual(301)
    expect(response.headers.location).toEqual('/studio')
  })

  it('keeps the query string, so a deep link opens the same file', async () => {
    const response = await request(app).get('/SASjsStudio?filePath=/a%2Fb.sas')

    expect(response.headers.location).toEqual('/studio?filePath=/a%2Fb.sas')
  })

  it('moves the App Stream landing page, and only the landing page', async () => {
    expect((await request(app).get('/AppStream')).headers.location).toEqual(
      '/app'
    )
  })

  it('does not translate a name under the old prefix', async () => {
    // What followed the old prefix was an app's NAME, and an app is addressed by
    // its id now - there is nothing to translate a name into. The request is
    // left where it is, so the App Stream surface answers it, and an address no
    // app is served on gets the surface's `404` rather than a redirect.
    const appRoot = await request(app).get('/AppStream/Dashdemo')

    expect(appRoot.status).toEqual(200)
    expect(appRoot.headers.location).toBeUndefined()
    expect(appRoot.text).toEqual('shell')
  })

  it('leaves an app asset and the listing alone', async () => {
    // An asset an app names by an absolute path, and `/apps.json`, which is
    // data rather than an app called "apps.json".
    for (const path of [
      '/AppStream/Dashdemo/main.js',
      '/AppStream/apps.json'
    ]) {
      const response = await request(app).get(path)

      expect(response.status).toEqual(200)
      expect(response.text).toEqual('shell')
    }
  })

  it('does not redirect a request that is not a GET or a HEAD', async () => {
    // A 301 on a state-changing request is replayed by some clients as a GET.
    const response = await request(app).post('/SASjsStudio')

    expect(response.status).toEqual(404)
  })
})
