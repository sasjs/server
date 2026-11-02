jest.mock('../utils/installFatalGuards', () => ({
  installFatalGuards: jest.fn()
}))

import { readFileSync } from 'fs'
import { join } from 'path'

import { installFatalGuards } from '../utils/installFatalGuards'

// the import under test: its only job is to install the guards, which has to
// happen before ./app and its dependency graph are evaluated
import '../fatalGuards'

describe('the fatalGuards bootstrap', () => {
  it('installs the guards as an import side effect', () => {
    expect(installFatalGuards).toHaveBeenCalledTimes(1)
  })

  it('keeps the module narrow enough to load ahead of the app', () => {
    // read rather than inspect require.cache: jest keeps its own module registry
    // and does not populate Node's, so a cache lookup would pass on any import
    // list at all - including one that pulled the app in
    const source = readFileSync(join(__dirname, '..', 'fatalGuards.ts'), 'utf8')

    expect(source.match(/^import .*$/gm) ?? []).toEqual([
      "import { installFatalGuards } from './utils/installFatalGuards'"
    ])
  })
})
