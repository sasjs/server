import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

/**
 * Guard for the Swagger UI assets the API serves from disk.
 *
 * `express.static('../public')` is mounted at the root, so a file under
 * `public/SASjsApi/` wins over the copy `swagger-ui-express` would serve from
 * `swagger-ui-dist`. The copy exists on purpose: the packaged executable bundles
 * `build/public/**` and cannot read the dependency from disk. The cost is that a
 * stale copy silently styles a newer UI.
 *
 * That is what happened here. A 2021 stylesheet served beside the 5.33.0 bundle
 * collapsed every operation path to one character per line: the bundle renders
 * `.opblock-summary-path-description-wrapper`, which the older stylesheet does
 * not know about, while its own `.opblock-summary-path` rule still caps the
 * width at `calc(100% - 110px - 15rem)`. With no wrapper rule the cap resolved
 * against a container narrower than the subtraction, so the path wrapped at
 * every character.
 *
 * These tests keep the copy in step with the package that renders the DOM.
 */

const apiRoot = path.resolve(__dirname, '../../../..')
const servedCssPath = path.join(apiRoot, 'public', 'SASjsApi', 'swagger-ui.css')

const distDirectory = path.dirname(
  require.resolve('swagger-ui-dist/package.json')
)
const distCssPath = path.join(distDirectory, 'swagger-ui.css')
const distVersion = require('swagger-ui-dist/package.json').version

const sha256 = (buffer: Buffer) =>
  crypto.createHash('sha256').update(buffer).digest('hex')

describe('bundled Swagger UI assets', () => {
  it('serves the stylesheet shipped by swagger-ui-dist', () => {
    const served = fs.readFileSync(servedCssPath)
    const installed = fs.readFileSync(distCssPath)

    if (!served.equals(installed)) {
      throw new Error(
        `public/SASjsApi/swagger-ui.css is out of step with swagger-ui-dist@${distVersion}.\n` +
          `  served:    ${sha256(served)}\n` +
          `  installed: ${sha256(installed)}\n` +
          'The API serves the copy in public/, so a stale copy styles a newer UI. Refresh it with:\n' +
          '  cp node_modules/swagger-ui-dist/swagger-ui.css public/SASjsApi/swagger-ui.css'
      )
    }
  })

  it('styles the summary wrapper the current bundle renders', () => {
    const css = fs.readFileSync(servedCssPath, 'utf8')

    // Without this rule the wrapper stays at its initial `display: block`, the
    // path's `max-width: calc(100% - ...)` resolves against a narrow container,
    // and every route renders one character per line.
    expect(css).toContain('.opblock-summary-path-description-wrapper')
  })

  it('does not shadow the generated swagger-ui-init.js', () => {
    // `swagger-ui-express` builds this file in memory from the options passed
    // to `setup()` (its `swaggerInitFunction`), so it never needs to be on
    // disk, and a checked-in copy wins over the generated one through the same
    // static mount. That copy silently pins the Swagger UI to whatever
    // `swaggerOptions` were in place when it was written, so edits to the
    // route's options have no effect.
    const initPath = path.join(
      apiRoot,
      'public',
      'SASjsApi',
      'swagger-ui-init.js'
    )

    expect(fs.existsSync(initPath)).toBe(false)
  })
})
