import path from 'path'
import fs from 'fs'
import os from 'os'
import { getEnvCSPDirectives } from '../parseHelmetConfig'

/**
 * The default policy is the guard for sasjs/server#168: no `'unsafe-inline'`
 * on the script directives, so an injected script tag cannot run.
 */
describe('getEnvCSPDirectives', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'csp-'))
    process.logger = {
      error: jest.fn(),
      info: jest.fn()
    } as any
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('allows no inline scripts by default', () => {
    const directives = getEnvCSPDirectives(undefined)

    expect(directives['script-src']).toEqual(["'self'"])
    expect(directives['script-src-attr']).toEqual(["'none'"])
  })

  it('allows no inline scripts when the config path is an empty string', () => {
    const directives = getEnvCSPDirectives('')

    expect(directives['script-src']).toEqual(["'self'"])
    expect(directives['script-src-attr']).toEqual(["'none'"])
  })

  it('honours a config file, so an app needing inline scripts can opt back in', () => {
    const configPath = path.join(tmpDir, 'csp.config.json')

    fs.writeFileSync(
      configPath,
      JSON.stringify({
        'script-src': ["'self'", "'unsafe-inline'"],
        'script-src-attr': ["'self'", "'unsafe-inline'"]
      })
    )

    const directives = getEnvCSPDirectives(
      path.relative(process.cwd(), configPath)
    )

    expect(directives['script-src']).toEqual(["'self'", "'unsafe-inline'"])
    expect(directives['script-src-attr']).toEqual(["'self'", "'unsafe-inline'"])
  })

  it('falls back to the default when the config file is not valid json', () => {
    const configPath = path.join(tmpDir, 'csp.config.json')

    fs.writeFileSync(configPath, 'not json at all')

    const directives = getEnvCSPDirectives(
      path.relative(process.cwd(), configPath)
    )

    expect(directives['script-src']).toEqual(["'self'"])
  })

  it('falls back to the default when the config file is absent', () => {
    const directives = getEnvCSPDirectives(
      path.relative(process.cwd(), path.join(tmpDir, 'missing.json'))
    )

    expect(directives['script-src']).toEqual(["'self'"])
  })

  /**
   * The app frames the server's own documentation page, so the policy has to
   * permit that origin by name rather than by falling back to `default-src`.
   */
  it("permits the app's own frames by default", () => {
    expect(getEnvCSPDirectives(undefined)['frame-src']).toEqual(["'self'"])
  })

  /**
   * A file layers over the defaults instead of replacing them. Replacing them
   * drops whatever the file does not mention, and the two directives the server
   * itself depends on go first: `img-src` with `blob:` (the Studio's image
   * preview) and `frame-src` with `'self'` (the API screen).
   */
  it('keeps the defaults a config file leaves out', () => {
    const configPath = path.join(tmpDir, 'csp.config.json')

    fs.writeFileSync(configPath, JSON.stringify({ 'script-src': ["'self'"] }))

    const directives = getEnvCSPDirectives(
      path.relative(process.cwd(), configPath)
    )

    expect(directives['img-src']).toEqual(["'self'", 'data:', 'blob:'])
    expect(directives['frame-src']).toEqual(["'self'"])
  })

  /**
   * The deployment that reported the blank API screen: a `default-src` of
   * `'all'`, which is not a CSP keyword, so a frame with nothing more specific
   * to fall back to is refused. Naming `frame-src` keeps the app's own frame
   * out of that fallback.
   */
  it('keeps the frame directive when a file narrows default-src', () => {
    const configPath = path.join(tmpDir, 'csp.config.json')

    fs.writeFileSync(
      configPath,
      JSON.stringify({ 'default-src': ["'all'"], 'img-src': ["'self'"] })
    )

    const directives = getEnvCSPDirectives(
      path.relative(process.cwd(), configPath)
    )

    expect(directives['default-src']).toEqual(["'all'"])
    expect(directives['frame-src']).toEqual(["'self'"])
  })

  it('still lets a file state its own frame directive', () => {
    const configPath = path.join(tmpDir, 'csp.config.json')

    fs.writeFileSync(
      configPath,
      JSON.stringify({ 'frame-src': ["'self'", 'https://example.com'] })
    )

    const directives = getEnvCSPDirectives(
      path.relative(process.cwd(), configPath)
    )

    expect(directives['frame-src']).toEqual(["'self'", 'https://example.com'])
  })
})
