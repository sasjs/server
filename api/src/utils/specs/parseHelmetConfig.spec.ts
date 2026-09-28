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
      error: jest.fn()
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
})
