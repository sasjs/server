import { Express } from 'express'
import request from 'supertest'
import appPromise from '../../app'

/**
 * The host page is a testing tool, so these tests cover its two obligations:
 * it is not reachable unless enabled, and when enabled it delivers VA's sandbox
 * attribute set rather than an unrestricted frame.
 */
describe('ddc host', () => {
  let app: Express
  const originalEnv = { ...process.env }

  beforeAll(async () => {
    app = await appPromise
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('is not reachable unless DDC_HOST_ENABLED is set', async () => {
    delete process.env.DDC_HOST_ENABLED

    const res = await request(app).get('/ddc-host')

    expect(res.status).toBe(404)
    expect(res.text).not.toContain('<iframe')
  })

  it('treats an empty or zero value as disabled', async () => {
    for (const value of ['', '0', 'false', 'off']) {
      process.env.DDC_HOST_ENABLED = value
      const res = await request(app).get('/ddc-host')
      expect(res.status).toBe(404)
    }
  })

  it('serves the page when enabled', async () => {
    process.env.DDC_HOST_ENABLED = 'true'

    const res = await request(app).get('/ddc-host')

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toContain('text/html')
    expect(res.text).toContain('<iframe')
  })

  it("defaults the frame to VA's sandbox attribute set", async () => {
    process.env.DDC_HOST_ENABLED = 'true'

    const res = await request(app).get('/ddc-host')

    // A permissive frame would let the page be used for framing anything; these
    // are the attributes VA grants, and allow-same-origin plus allow-scripts are
    // the pair an embedded app actually needs.
    expect(res.text).toContain('allow-forms')
    expect(res.text).toContain('allow-same-origin')
    expect(res.text).toContain('allow-scripts')
    expect(res.text).toContain('allow-popups-to-escape-sandbox')
  })

  it('describes the delivery timings it supports', async () => {
    process.env.DDC_HOST_ENABLED = 'true'

    const res = await request(app).get('/ddc-host')

    // A single post on load reaches the app after it has bootstrapped, which is
    // the one window that cannot reproduce a report refresh: the deferred
    // initial load reads only what the app's earliest listener captured.
    expect(res.text).toContain('timing=early')
    expect(res.text).toContain('timing=both')
  })

  it('serves its script as its own file, because the CSP refuses inline', async () => {
    process.env.DDC_HOST_ENABLED = 'true'

    const page = await request(app).get('/ddc-host')
    const script = await request(app).get('/ddc-host.js')

    // 'script-src self' is the default policy, so the page cannot carry an
    // inline script: it would render, the frame stays empty, and the failure
    // looks like a broken app rather than a blocked page.
    expect(page.text).toContain('<script src="/ddc-host.js">')
    expect(script.status).toBe(200)
    expect(script.headers['content-type']).toContain('javascript')
    expect(script.text).toContain('postMessage')
    expect(script.text).toContain('startEarlyReplay')
  })

  it('does not serve its script when disabled', async () => {
    delete process.env.DDC_HOST_ENABLED

    const res = await request(app).get('/ddc-host.js')

    expect(res.status).toBe(404)
    expect(res.text).not.toContain('startEarlyReplay')
  })

  it('is not served from the static folder', async () => {
    // It lives outside public/, so the gate above cannot be bypassed by asking
    // for the file directly.
    process.env.DDC_HOST_ENABLED = 'true'

    const res = await request(app).get('/ddc-host.html')

    expect(res.text).not.toContain('allow-popups-to-escape-sandbox')
  })
})
