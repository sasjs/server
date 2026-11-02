jest.mock('../utils/installFatalGuards', () => ({
  installFatalGuards: jest.fn()
}))

import { installFatalGuards } from '../utils/installFatalGuards'

// the import under test: its only job is to install the guards, which has to
// happen before ./app and its dependency graph are evaluated
import '../fatalGuards'

describe('the fatalGuards bootstrap', () => {
  it('installs the guards as an import side effect', () => {
    expect(installFatalGuards).toHaveBeenCalledTimes(1)
  })

  it('imports nothing that initialises the app', () => {
    // the ordering guarantee is only worth something while the module stays
    // this narrow: one import, of the guard itself
    const modules = Object.keys(require.cache).filter((path) =>
      path.includes('/api/src/app')
    )

    expect(modules).toHaveLength(0)
  })
})
