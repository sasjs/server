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
    ['/SASjsApiDocs', '/api']
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

  it('moves the App Stream landing page and an app root', async () => {
    expect((await request(app).get('/AppStream')).headers.location).toEqual(
      '/app'
    )

    const appRoot = await request(app).get('/AppStream/Dashdemo')

    expect(appRoot.status).toEqual(301)
    expect(appRoot.headers.location).toEqual('/app/Dashdemo/')
  })

  it('leaves an app asset where it is', async () => {
    // The app that was published under the old prefix may name its files by an
    // absolute path; redirecting every one of them would buy nothing a reader
    // can see. Only the app's own root moves.
    const asset = await request(app).get('/AppStream/Dashdemo/main.js')

    expect(asset.status).toEqual(200)
    expect(asset.text).toEqual('shell')
  })

  it('leaves the apps listing alone', async () => {
    // `/apps.json` is data, not an app called "apps.json".
    const listing = await request(app).get('/AppStream/apps.json')

    expect(listing.status).toEqual(200)
    expect(listing.text).toEqual('shell')
  })

  it('does not redirect a request that is not a GET or a HEAD', async () => {
    // A 301 on a state-changing request is replayed by some clients as a GET.
    const response = await request(app).post('/SASjsStudio')

    expect(response.status).toEqual(404)
  })
})
