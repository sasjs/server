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
    expect(res.text).toContain('postMessage')
  })

  it('is not served from the static folder', async () => {
    // It lives outside public/, so the gate above cannot be bypassed by asking
    // for the file directly.
    process.env.DDC_HOST_ENABLED = 'true'

    const res = await request(app).get('/ddc-host.html')

    expect(res.text).not.toContain('allow-popups-to-escape-sandbox')
  })
})
