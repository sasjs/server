import os from 'os'
import path from 'path'
import { deleteFolder, generateTimestamp } from '@sasjs/utils'

import { SessionController } from '../Session'
import { RunTimeType } from '../../../utils/verifyEnvVariables'

/**
 * A caller's own session id names a session of ITS own.
 *
 * The id comes from the caller - the emulated Viya estate derives it from the
 * estate's seed and a counter - so it is neither secret nor unique: two accounts
 * that name the same id are two sessions, and handing the second one the first
 * one's folder means reading and overwriting its `webout.txt` and `log.log`.
 *
 * The name is also forgotten when the session goes. A map that keeps it grows for
 * the life of the process, and a later lookup would name a folder that has been
 * deleted.
 */
describe('sessions named by the caller', () => {
  let controller: SessionController
  let root: string

  beforeAll(() => {
    root = path.join(os.tmpdir(), `sasjs-named-sessions-${generateTimestamp()}`)

    process.sasjsRoot = root
    process.driveLoc = path.join(root, 'drive')
    process.runTimes = [RunTimeType.SAS]
  })

  beforeEach(() => {
    controller = new SessionController()
  })

  afterAll(async () => {
    await deleteFolder(root)
  })

  it('gives two callers two sessions when they name the same id', async () => {
    const alice = await controller.getSessionForId('session-1', 'alice')
    const bob = await controller.getSessionForId('session-1', 'bob')

    expect(alice.path).not.toEqual(bob.path)
    expect(bob.owner).toEqual('bob')
  })

  it('hands the same caller the same session for the same id', async () => {
    const first = await controller.getSessionForId('session-2', 'alice')
    const second = await controller.getSessionForId('session-2', 'alice')

    expect(second.id).toEqual(first.id)
  })

  it('keeps the session for the idle window the caller states', async () => {
    const idleMs = 60 * 60 * 1000
    const first = await controller.getSessionForId('session-3', 'alice', idleMs)
    const before = Date.now()

    const second = await controller.getSessionForId(
      'session-3',
      'alice',
      idleMs
    )

    expect(second.id).toEqual(first.id)
    // the window is stated per call and pushed forward on use, so a session in
    // use does not expire under the client that is using it
    expect(parseInt(second.deathTimeStamp)).toBeGreaterThanOrEqual(
      before + idleMs - 1000
    )
  })

  it('forgets the name when the session goes', async () => {
    const first = await controller.getSessionForId('session-4', 'alice')

    await (controller as any).deleteSession(first)

    // the entry, not just the session: a map that keeps it grows for the life of
    // the process, once per session any caller ever named
    expect((controller as any).sessionIds.size).toEqual(0)

    const second = await controller.getSessionForId('session-4', 'alice')

    expect(second.id).not.toEqual(first.id)
  })
})
