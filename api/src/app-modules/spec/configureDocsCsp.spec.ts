import express, { Express } from 'express'
import request from 'supertest'

import { configureSecurity } from '../configureSecurity'
import { allowInlineScripts, docsInlineScripts } from '../configureDocsCsp'

/**
 * The docs site's inline scripts have to run wherever the pages are served, and
 * nowhere else.
 *
 * The tests here are on the real helmet output rather than on a string built in
 * the test, because the point is the interaction: helmet sets the header, and
 * this middleware rewrites the policy it finds for one mount.
 */
const buildApp = (): Express => {
  const app = express()

  configureSecurity(app)
  app.use('/docs', docsInlineScripts)
  app.get('/docs/probe', (_req, res) => res.status(200).send('docs'))
  app.get('/probe', (_req, res) => res.status(200).send('app'))

  return app
}

const cspOf = (res: request.Response): string =>
  String(res.headers['content-security-policy'] ?? '')

const scriptSrcOf = (policy: string): string =>
  policy
    .split(';')
    .map((directive) => directive.trim())
    .find((directive) => /^script-src /i.test(directive)) ?? ''

describe('docsInlineScripts', () => {
  const app = buildApp()

  it('allows inline scripts on the docs mount', async () => {
    const res = await request(app).get('/docs/probe').expect(200)

    expect(scriptSrcOf(cspOf(res))).toBe("script-src 'self' 'unsafe-inline'")
  })

  it('leaves the rest of the policy as helmet set it', async () => {
    const res = await request(app).get('/docs/probe').expect(200)
    const policy = cspOf(res)

    expect(policy).toContain("default-src 'self'")
    expect(policy).toContain("object-src 'none'")
    // the attribute directive is separate: relaxing script-src must not touch it
    expect(policy).toContain("script-src-attr 'none'")
    expect(policy).toContain("frame-ancestors 'self'")
  })

  it('leaves every other path alone', async () => {
    const res = await request(app).get('/probe').expect(200)

    // `style-src` already carries 'unsafe-inline' in helmet's defaults, so the
    // assertion is on the directive that decides script execution rather than on
    // the policy as a whole.
    expect(scriptSrcOf(cspOf(res))).toBe("script-src 'self'")
  })
})

describe('allowInlineScripts', () => {
  it('is idempotent, so a second pass does not repeat the keyword', () => {
    const once = allowInlineScripts("default-src 'self'; script-src 'self'")
    expect(allowInlineScripts(once)).toBe(once)
  })

  it('introduces script-src when the policy only has default-src', () => {
    // Without this, the keyword would be ignored: a page with no script-src
    // falls back to default-src, and the relaxation would silently do nothing.
    const relaxed = allowInlineScripts("default-src 'self'; img-src 'self'")

    expect(relaxed).toContain("script-src 'self' 'unsafe-inline'")
    expect(relaxed).toContain("default-src 'self'")
  })

  it('does not relax script-src-attr or script-src-elem', () => {
    const relaxed = allowInlineScripts(
      "script-src-attr 'none'; script-src-elem 'self'"
    )

    expect(relaxed).toContain("script-src-attr 'none'")
    expect(relaxed).toContain("script-src-elem 'self'")
    expect(relaxed).toContain("script-src 'self' 'unsafe-inline'")
  })
})
