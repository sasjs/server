import path from 'path'
import fs from 'fs'
import { createFile, deleteFolder } from '@sasjs/utils'

import {
  addEntryToAppStreamConfig,
  readStoredAppStreamConfig
} from '../appStreamConfig'
import { appIdFor, normaliseAppLoc } from '../appStreamIdentity'

/**
 * The identity, as the registry actually writes it.
 *
 * The pure-function spec can stay green while the publish path stores the wrong
 * id, so these cases are about what an entry ends up holding: the review of the
 * first version pointed out that deleting the same-folder exclusion would leave
 * that suite passing.
 */
describe('Publishing an app stream entry', () => {
  const drive = path.join(__dirname, 'tmp', 'appStreamPublish')
  const configPath = path.join(drive, 'appStreamConfig.json')

  beforeEach(() => {
    jest.spyOn(require('../file'), 'getSasjsDriveFolder').mockReturnValue(drive)
    jest
      .spyOn(require('../file'), 'getAppStreamConfigPath')
      .mockReturnValue(configPath)

    process.logger = { ...(process.logger as any), error: jest.fn() } as any
    process.appStreamConfig = {}
  })

  afterEach(async () => {
    jest.restoreAllMocks()
    await deleteFolder(drive).catch(() => undefined)
  })

  const stored = () => JSON.parse(fs.readFileSync(configPath, 'utf8'))

  it("writes the folder's id into the entry and into the file", async () => {
    await addEntryToAppStreamConfig('mario', '/Public/apps/mario', 'web')

    const id = appIdFor('/Public/apps/mario')

    expect(process.appStreamConfig.mario.id).toBe(id)
    expect(stored().mario.id).toBe(id)
  })

  it('keeps the id when the same folder is republished under the same name', async () => {
    await addEntryToAppStreamConfig('mario', '/Public/apps/mario', 'web')

    const id = process.appStreamConfig.mario.id

    await addEntryToAppStreamConfig('mario', '/Public/apps/mario', 'web')

    expect(process.appStreamConfig.mario.id).toBe(id)
  })

  it('gives a second name for one folder the same id', async () => {
    await addEntryToAppStreamConfig('mario', '/Public/apps/mario', 'web')
    await addEntryToAppStreamConfig(
      'mario-mobile',
      '/Public/apps/mario',
      'mobile'
    )

    expect(process.appStreamConfig['mario-mobile'].id).toBe(
      process.appStreamConfig.mario.id
    )
  })

  it('recomputes the id when a name is republished against another folder', async () => {
    await addEntryToAppStreamConfig('mario', '/Public/apps/mario', 'web')

    const marioId = process.appStreamConfig.mario.id

    await addEntryToAppStreamConfig('mario', '/Public/apps/sonic', 'web')

    expect(process.appStreamConfig.mario.id).toBe(
      appIdFor('/Public/apps/sonic')
    )
    expect(process.appStreamConfig.mario.id).not.toBe(marioId)
  })

  it('treats another spelling of one folder as one app', async () => {
    await addEntryToAppStreamConfig('mario', '/Public/apps/mario', 'web')
    await addEntryToAppStreamConfig('mario', '/Public/apps/x/../mario', 'web')

    expect(process.appStreamConfig.mario.id).toBe(
      appIdFor(normaliseAppLoc('/Public/apps/mario'))
    )
  })

  /**
   * The load-path guard, which had no spec: deleting it left every suite green,
   * so nothing would have caught its removal.
   */
  it('drops an id that no publish could have written, and says so', async () => {
    await createFile(
      configPath,
      JSON.stringify({
        mario: { appLoc: '/Public/apps/mario', streamWebFolder: 'web', id: 5 },
        sonic: {
          appLoc: '/Public/apps/sonic',
          streamWebFolder: 'web',
          id: 'abcdef012'
        }
      })
    )

    const config = await readStoredAppStreamConfig()

    // not a string
    expect(config.mario).toBeDefined()
    expect(config.mario.id).toBeUndefined()

    // a nine-character hex string: shaped like an id, but not a length appIdFor
    // can mint, so it is an identity no publish could have produced
    expect(config.sonic).toBeDefined()
    expect(config.sonic.id).toBeUndefined()

    expect(process.logger?.error).toHaveBeenCalledTimes(2)
  })
})
