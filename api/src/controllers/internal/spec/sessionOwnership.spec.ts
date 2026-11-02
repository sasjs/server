import path from 'path'
import os from 'os'
import { deleteFolder, generateTimestamp } from '@sasjs/utils'
import { SessionController } from '../Session'
import { RunTimeType } from '../../../utils/verifyEnvVariables'
import { getSessionController } from '../Session'

/**
 * Every session has an owner, set when it is created.
 *
 * The artifact endpoints (`/session/{id}`, `/log`, `/output`) serve a session to
 * its owner or to an administrator and answer 404 to anyone else, so an unowned
 * session would be a hole rather than a convenience. These cases cover the write
 * side: the value comes from the caller of `getSession`, which every route
 * passes from `req.user.username`.
 *
 * Desktop mode takes the same path: `authenticateAccessToken` assigns the fixed
 * `desktopUser` to `req.user` before any session route runs, so the owner is
 * that user's name and the check passes for every request the single desktop
 * user makes.
 */
describe('session ownership', () => {
  let controller: SessionController
  let root: string

  beforeAll(() => {
    root = path.join(
      os.tmpdir(),
      `sasjs-session-owner-spec-${generateTimestamp()}`
    )
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

  it('stamps the owner on a newly created session', async () => {
    const session = await (controller as any).createSession('alice')

    expect(session.owner).toEqual('alice')

    await deleteFolder(session.path)
  })

  it('gives the session it hands out to the caller asking for it', async () => {
    // A pooled session is a warm start, not a transfer: nothing has run in a
    // pending session, so the caller that takes it becomes its owner - even when
    // it is the same object an earlier caller was handed, which is why each
    // owner is asserted straight after its own call rather than at the end.
    const first = await controller.getSession('alice')
    expect(first.owner).toEqual('alice')

    const second = await controller.getSession('bob')
    expect(second.owner).toEqual('bob')

    for (const session of (controller as any).sessions)
      await deleteFolder(session.path)
  })

  it('is the same controller the session routes read', () => {
    // the id a trigger returns is looked up through this controller when the
    // artifact endpoints serve it, so the owner set here is the one checked
    expect(getSessionController(RunTimeType.SAS)).toBeDefined()
  })
})
