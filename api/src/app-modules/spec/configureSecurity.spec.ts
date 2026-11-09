import express, { Express } from 'express'
import request from 'supertest'
import { readFile } from 'fs/promises'
import path from 'path'

import { configureSecurity } from '../configureSecurity'
import { getEnvCSPDirectives } from '../../utils/parseHelmetConfig'

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

  it('should let the page draw a drive image from an object URL', async () => {
    // The Studio previews a picture by creating a blob: URL; a policy without
    // it leaves the pane empty with a console violation and nothing else
    process.env.HTTP_PORT = '5000'
    process.env.HELMET_CSP_CONFIG_PATH = ''

    const policy = cspOf(await request(buildApp()).get('/probe'))
    const imgSrc = policy
      .split(';')
      .map((directive) => directive.trim())
      .find((directive) => directive.startsWith('img-src'))

    expect(imgSrc).toBeDefined()
    expect(imgSrc).toContain('blob:')
    // the two it already allowed stay allowed
    expect(imgSrc).toContain("'self'")
    expect(imgSrc).toContain('data:')
  })

  it('should keep the example config in step with the defaults', async () => {
    // An operator builds a policy from this file. A file layers over the
    // defaults, so a directive it states must state the default value - an
    // example that quietly loosened one would be copied into deployments.
    const example = JSON.parse(
      await readFile(
        path.join(__dirname, '../../../csp.config.example.json'),
        'utf8'
      )
    )
    const defaults = getEnvCSPDirectives(undefined) as Record<string, string[]>

    for (const [directive, value] of Object.entries(example)) {
      expect(defaults[directive]).toEqual(value)
    }

    // and the example covers the directives the defaults set, so copying it is
    // a no-op rather than a partial policy
    expect(Object.keys(example).sort()).toEqual(Object.keys(defaults).sort())
  })

  it('should keep the settings reference in step with the defaults', async () => {
    // The CSP examples live in the settings reference, which is built into the
    // site from this repository - and that copy is the one that drifted: it
    // omitted `blob:` after the default gained it, in the very example offered
    // for the inline-script apps that draw a drive image. Parsing the page is
    // what keeps it honest, now that the README links here instead of repeating
    // the settings.
    const reference = await readFile(
      path.join(__dirname, '../../../../docs/pages/settings.md'),
      'utf8'
    )

    const blocks: Record<string, string[]>[] = []
    let current: string[] | null = null

    for (const line of reference.split('\n')) {
      const trimmed = line.trim()

      if (trimmed.startsWith('```')) {
        if (current === null) {
          current = []
          continue
        }

        // only a fenced block of directives is one of the examples
        try {
          const parsed = JSON.parse(current.join('\n'))

          if (parsed && typeof parsed === 'object' && parsed['img-src'])
            blocks.push(parsed)
        } catch (error) {
          /* a block that is not JSON is not a CSP example */
        }

        current = null
        continue
      }

      if (current) current.push(line)
    }

    expect(blocks.length).toBeGreaterThan(1)

    const defaults = getEnvCSPDirectives(undefined) as Record<string, string[]>

    // the first block is offered as the defaults themselves
    expect(blocks[0]).toEqual(defaults)

    // and every block keeps the img-src the default policy allows: the one
    // directive a loosened policy has no reason to change
    for (const block of blocks) {
      expect(block['img-src']).toEqual(defaults['img-src'])
    }
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
