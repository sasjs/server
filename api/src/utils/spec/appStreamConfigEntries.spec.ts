import path from 'path'
import { createFile, deleteFolder } from '@sasjs/utils'

import { readStoredAppStreamConfig } from '../appStreamConfig'
import { getSasjsDriveFolder } from '../file'

/**
 * A registry is judged entry by entry.
 *
 * The behaviour these pin is the difference between "one app is misconfigured"
 * and "the server has no apps": the previous validator rejected the whole file
 * if a single entry failed, returned an empty registry, and logged that the
 * config had loaded. An author then looked at a working upload and a missing app.
 */
describe('App Stream config entries', () => {
  const drive = path.join(__dirname, 'tmp', 'appStreamConfigEntries')
  const configPath = path.join(drive, 'appStreamConfig.json')

  let errorSpy: jest.SpyInstance

  beforeEach(async () => {
    jest.spyOn(require('../file'), 'getSasjsDriveFolder').mockReturnValue(drive)
    jest
      .spyOn(require('../file'), 'getAppStreamConfigPath')
      .mockReturnValue(configPath)

    errorSpy = jest.fn()
    process.logger = { ...(process.logger as any), error: errorSpy } as any
  })

  afterEach(async () => {
    jest.restoreAllMocks()
    await deleteFolder(drive).catch(() => undefined)
  })

  const write = (content: string) => createFile(configPath, content)

  it('keeps the valid entries and names the ones it drops', async () => {
    await write(
      JSON.stringify({
        goodApp: { appLoc: '/Public/apps/good', streamWebFolder: 'web' },
        noAppLoc: { streamWebFolder: 'web' },
        badWebFolder: { appLoc: '/Public/apps/bad', streamWebFolder: 42 },
        notAnObject: 'a string'
      })
    )

    const config = await readStoredAppStreamConfig()

    expect(Object.keys(config)).toEqual(['goodApp'])
    expect(config.goodApp).toEqual({
      appLoc: '/Public/apps/good',
      streamWebFolder: 'web'
    })

    const messages = errorSpy.mock.calls.map((call) => String(call[0]))

    expect(messages).toHaveLength(3)
    expect(messages.find((m) => m.includes('noAppLoc'))).toContain('appLoc')
    expect(messages.find((m) => m.includes('badWebFolder'))).toContain(
      'streamWebFolder'
    )
    expect(messages.find((m) => m.includes('notAnObject'))).toContain(
      'not an object'
    )
  })

  it('quotes the expected shape, so the fix is not a guess', async () => {
    await write(JSON.stringify({ app: { streamWebFolder: 'web' } }))

    await readStoredAppStreamConfig()

    expect(String(errorSpy.mock.calls[0][0])).toContain(
      '{ "appLoc": string, "streamWebFolder": string'
    )
  })

  it('treats an empty string as missing, not as a location', async () => {
    await write(
      JSON.stringify({
        app: { appLoc: '   ', streamWebFolder: 'web' }
      })
    )

    expect(await readStoredAppStreamConfig()).toEqual({})
    expect(String(errorSpy.mock.calls[0][0])).toContain('appLoc')
  })

  it('accepts a logo, and publishes nothing it cannot read', async () => {
    await write(
      JSON.stringify({
        app: {
          appLoc: '/Public/apps/app',
          streamWebFolder: 'web',
          streamLogo: 'logo.png'
        }
      })
    )

    const config = await readStoredAppStreamConfig()

    expect(config.app.streamLogo).toBe('logo.png')
    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('says when the file is not JSON at all', async () => {
    await write('{ this is not json')

    expect(await readStoredAppStreamConfig()).toEqual({})
    expect(String(errorSpy.mock.calls[0][0])).toContain(
      'could not be read as JSON'
    )
  })

  it('says when the file is JSON but not an object of entries', async () => {
    await write(JSON.stringify(['appLoc']))

    expect(await readStoredAppStreamConfig()).toEqual({})
    expect(String(errorSpy.mock.calls[0][0])).toContain(
      'not an object of app entries'
    )
  })

  it('returns an empty registry for a drive with no config file', async () => {
    expect(await readStoredAppStreamConfig()).toEqual({})
    expect(errorSpy).not.toHaveBeenCalled()
  })
})
