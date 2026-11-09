import fs from 'fs'
import os from 'os'
import path from 'path'

import { MockSas9Controller } from '../mock-sas9'

/**
 * The SAS 9 mock reads its files from STATIC_MOCK_LOCATION. The setting was
 * honoured by one of eight read sites, and an absolute value was resolved under
 * the working directory even then; these cases pin both.
 */
describe('MockSas9Controller mock location', () => {
  const original = process.env.STATIC_MOCK_LOCATION
  let mocksFolder: string

  beforeEach(() => {
    mocksFolder = fs.mkdtempSync(path.join(os.tmpdir(), 'sas9-mocks-'))
    fs.mkdirSync(path.join(mocksFolder, 'sas9', 'generic'), { recursive: true })
    fs.mkdirSync(path.join(mocksFolder, 'sas9', 'custom'), { recursive: true })
    fs.writeFileSync(
      path.join(mocksFolder, 'sas9', 'generic', 'sas-stored-process'),
      'FROM-THE-CONFIGURED-FOLDER'
    )
    fs.writeFileSync(
      path.join(mocksFolder, 'sas9', 'custom', 'program'),
      'FROM-THE-PROGRAM-FOLDER'
    )
    process.env.STATIC_MOCK_LOCATION = mocksFolder
  })

  afterEach(() => {
    if (original === undefined) delete process.env.STATIC_MOCK_LOCATION
    else process.env.STATIC_MOCK_LOCATION = original
    fs.rmSync(mocksFolder, { recursive: true, force: true })
  })

  const loggedInController = () => {
    const controller = new MockSas9Controller()
    ;(controller as any).loggedIn = 'user'
    return controller
  }

  it('reads the default stored process from an absolute folder', async () => {
    const response = await loggedInController().sasStoredProcess({
      query: {}
    } as any)

    expect(response.content).toBe('FROM-THE-CONFIGURED-FOLDER')
    expect(response.error).toBe(false)
  })

  it('reads a requested program from the same folder', async () => {
    const response = await loggedInController().sasStoredProcess({
      query: { _program: '/custom/program' }
    } as any)

    expect(response.content).toBe('FROM-THE-PROGRAM-FOLDER')
  })
})
