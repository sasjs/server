import fs from 'fs'
import os from 'os'
import path from 'path'

import {
  copySwaggerUiAssets,
  swaggerUiAssets,
  swaggerUiDistFolder,
  swaggerUiNotices
} from '../../../utils/swaggerUiAssets'

/**
 * Guard for the Swagger UI the API serves.
 *
 * `public/SASjsApi/index.html` is the documentation page, and the assets beside
 * it are copied from the pinned `swagger-ui-dist` devDependency by
 * `scripts/copySwaggerUi.ts`. Nothing from that package is installed at
 * runtime, because it depends on `@scarf/scarf`, whose postinstall reports the
 * install to scarf.sh.
 *
 * Two things can therefore go wrong silently, and both are covered here: a page
 * that points at an asset the build does not copy (a blank or unstyled UI), and
 * a page that reaches a third party (the leak this arrangement exists to stop).
 */

const apiRoot = path.resolve(__dirname, '../../../..')
const pagePath = path.join(apiRoot, 'public', 'SASjsApi', 'index.html')
const initPath = path.join(apiRoot, 'public', 'SASjsApi', 'swagger-ui-init.js')

const page = () => fs.readFileSync(pagePath, 'utf8')
const init = () => fs.readFileSync(initPath, 'utf8')

describe('bundled Swagger UI assets', () => {
  let destination: string

  beforeAll(() => {
    destination = fs.mkdtempSync(path.join(os.tmpdir(), 'sasjs-swagger-ui-'))
    copySwaggerUiAssets(destination)
  })

  afterAll(() => {
    fs.rmSync(destination, { recursive: true, force: true })
  })

  it('copies every asset the page loads from swagger-ui-dist', () => {
    const distFolder = swaggerUiDistFolder()

    for (const file of swaggerUiAssets) {
      expect(fs.existsSync(path.join(destination, file))).toBe(true)
      expect(
        fs
          .readFileSync(path.join(destination, file))
          .equals(fs.readFileSync(path.join(distFolder, file)))
      ).toBe(true)
    }

    // Apache-2.0: the licence and notice travel with the files
    for (const file of swaggerUiNotices) {
      expect(fs.existsSync(path.join(destination, `swagger-ui-${file}`))).toBe(
        true
      )
    }
  })

  it('loads the page and its styles from this folder, not from a third party', () => {
    const html = page()

    const loaded = [
      'swagger-ui.css',
      'swagger-ui-bundle.js',
      'swagger-ui-standalone-preset.js',
      'swagger-ui-init.js',
      'favicon-32x32.png'
    ]
    for (const file of loaded) {
      expect(html).toContain(`./${file}`)
    }

    const external = html.match(/(src|href)\s*=\s*["']?https?:\/\//gi) || []
    expect(external).toEqual([])
  })

  it('starts Swagger UI against the local spec with no third-party validator', () => {
    const script = init()

    expect(script).toContain("url: '/swagger.yaml'")
    // the online validator posts the spec URL to validator.swagger.io
    expect(script).toContain('validatorUrl: null')
    // the API's own calls carry the session cookie and the CSRF header
    expect(script).toContain("request.credentials = 'include'")
    expect(script).toContain('X-XSRF-TOKEN')
  })

  it('keeps swagger-ui out of the runtime dependencies', () => {
    // swagger-ui-dist is a devDependency: it is the source of the copied
    // assets, and its tree carries @scarf/scarf's postinstall. Installing
    // @sasjs/server must not run anything that calls out.
    const manifest = JSON.parse(
      fs.readFileSync(path.join(apiRoot, 'package.json'), 'utf8')
    )
    const runtime = Object.keys(manifest.dependencies || {})

    expect(runtime).not.toContain('swagger-ui-express')
    expect(runtime).not.toContain('swagger-ui-dist')
    expect(Object.keys(manifest.devDependencies || {})).toContain(
      'swagger-ui-dist'
    )
  })
})
