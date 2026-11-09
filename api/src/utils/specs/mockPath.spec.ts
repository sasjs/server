import path from 'path'

import { mockUploadDestination, resolveMockPath } from '../mockPath'

describe('resolveMockPath', () => {
  const original = process.env.STATIC_MOCK_LOCATION

  afterEach(() => {
    if (original === undefined) delete process.env.STATIC_MOCK_LOCATION
    else process.env.STATIC_MOCK_LOCATION = original
  })

  it('uses an absolute folder as written', () => {
    // path.join(process.cwd(), '/srv/mocks') is '<cwd>/srv/mocks', which is the
    // defect this rule exists to prevent
    expect(resolveMockPath('/srv/mocks')).toBe('/srv/mocks')

    process.env.STATIC_MOCK_LOCATION = '/srv/mocks'
    expect(resolveMockPath()).toBe('/srv/mocks')
  })

  it('resolves a relative folder against the working directory', () => {
    process.env.STATIC_MOCK_LOCATION = 'custom-mocks'

    expect(resolveMockPath()).toBe(path.join(process.cwd(), 'custom-mocks'))
  })

  it('falls back to mocks when the setting is absent', () => {
    delete process.env.STATIC_MOCK_LOCATION

    expect(resolveMockPath()).toBe(path.join(process.cwd(), 'mocks'))
  })

  it('puts the uploads under the mock folder', () => {
    process.env.STATIC_MOCK_LOCATION = '/srv/mocks'

    expect(mockUploadDestination()).toBe(
      path.join('/srv/mocks', 'sas9', 'files-received')
    )
  })
})
