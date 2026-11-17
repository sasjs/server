import { readFileSync } from 'fs'
import path from 'path'
import { lintSchemaUrl } from '@sasjs/lint'
import lintSchema from '@sasjs/lint/sasjslint-schema.json'

const apiRoot = path.join(__dirname, '..', '..', '..')
const webRoot = path.join(apiRoot, '..', 'web')
const readManifest = (file: string) => JSON.parse(readFileSync(file, 'utf8'))

describe('the Studio lint schema', () => {
  it('uses the exact same lint version as the API', () => {
    const api = readManifest(path.join(apiRoot, 'package.json'))
    const web = readManifest(path.join(webRoot, 'package.json'))
    const version = api.dependencies['@sasjs/lint']
    expect(version).toMatch(/^\d+\.\d+\.\d+$/)
    expect(web.dependencies['@sasjs/lint']).toBe(version)
  })

  it('registers the schema under the uri documents carry', () => {
    // The editor registers the bundled schema under the schema's own `$id`,
    // because that is the only uri Monaco matches against a document's
    // `$schema` - and the documents carry `lintSchemaUrl`. The two are the same
    // string in the pinned release, and this asserts it: a release that changes
    // one and not the other would leave every document unmatched, and
    // completion, hover and diagnostics would stop with nothing failing.
    //
    // Both values are read from the API's own copy of the package, because this
    // suite runs in a job that installs ./api and nothing else - reading
    // web/node_modules here failed in CI for exactly that reason. The version
    // parity asserted above is what makes the API's copy the one the Studio
    // bundles; the end-to-end test resolves the web copy by name.
    expect(lintSchema.$id).toBe(lintSchemaUrl)
  })
})
