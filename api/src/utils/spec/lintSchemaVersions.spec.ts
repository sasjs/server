import { readFileSync } from 'fs'
import path from 'path'

const apiRoot = path.join(__dirname, '..', '..', '..')
const readManifest = (file: string) => JSON.parse(readFileSync(file, 'utf8'))

describe('the Studio lint schema', () => {
  it('uses the exact same lint version as the API', () => {
    const api = readManifest(path.join(apiRoot, 'package.json'))
    const web = readManifest(path.join(apiRoot, '..', 'web', 'package.json'))
    const version = api.dependencies['@sasjs/lint']
    expect(version).toMatch(/^\d+\.\d+\.\d+$/)
    expect(web.dependencies['@sasjs/lint']).toBe(version)
  })
})
