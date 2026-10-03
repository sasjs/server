import path from 'path'
import os from 'os'
import {
  createFile,
  deleteFolder,
  folderExists,
  generateTimestamp
} from '@sasjs/utils'
import { SessionController } from '../Session'
import { Session, SessionState } from '../../../types'
import { getSessionsFolder, generateUniqueFileName } from '../../../utils'

/**
 * The session lifecycle is what stops a deployment accumulating session folders
 * and what makes `expiresAfterMins` mean anything. It lives on the base
 * controller so every runtime gets it, not just the local SAS one - a triggered
 * program on any runtime would otherwise leave its folder behind forever.
 */
const makeSession = (deathInMs: number, state: SessionState): Session => {
  const sessionId = generateUniqueFileName(generateTimestamp())
  const creationTimeStamp = sessionId.split('-').pop() as string

  return {
    id: sessionId,
    state,
    creationTimeStamp,
    deathTimeStamp: (new Date().getTime() + deathInMs).toString(),
    path: path.join(getSessionsFolder(), sessionId)
  }
}

const scheduleDestroy = (controller: SessionController, session: Session) =>
  (controller as any).scheduleSessionDestroy(session)

const track = (controller: SessionController, session: Session) =>
  (controller as any).sessions.push(session)

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

describe('session lifecycle', () => {
  let controller: SessionController

  beforeAll(() => {
    const root = path.join(
      os.tmpdir(),
      `sasjs-session-lifecycle-spec-${generateTimestamp()}`
    )
    process.sasjsRoot = root
    process.driveLoc = path.join(root, 'drive')
  })

  beforeEach(() => {
    controller = new SessionController()
  })

  it('destroys an idle session when its death time arrives', async () => {
    const session = makeSession(300, SessionState.pending)
    await createFile(path.join(session.path, 'log.log'), 'some log')
    track(controller, session)

    scheduleDestroy(controller, session)
    await delay(900)

    // the folder goes, so disk does not grow without bound...
    expect(await folderExists(session.path)).toEqual(false)

    // ...and the id stops resolving, so a caller polling state gets a 404
    // rather than a state for a session that no longer exists.
    expect(controller.getSessionById(session.id)).toBeUndefined()
  })

  it('keeps a session that is still running at its death time', async () => {
    const session = makeSession(300, SessionState.running)
    await createFile(path.join(session.path, 'log.log'), 'some log')
    track(controller, session)

    const originalDeathTimeStamp = session.deathTimeStamp

    scheduleDestroy(controller, session)
    await delay(900)

    // A run that overruns its death time is not killed mid-flight - the destroy
    // is pushed out instead.
    expect(await folderExists(session.path)).toEqual(true)
    expect(controller.getSessionById(session.id)).toBeDefined()
    expect(parseInt(session.deathTimeStamp)).toBeGreaterThan(
      parseInt(originalDeathTimeStamp)
    )

    await deleteFolder(session.path)
  })

  it('schedules destruction for every runtime, not just sas', async () => {
    // The base controller is what js, py, r and sasviya sessions use; the local
    // sas controller only overrides how a session is created.
    const session = await (controller as any).createSession()

    expect(controller.getSessionById(session.id)).toBeDefined()

    // the timer is what removes it later - without it the folder leaks
    expect(session.deathTimeStamp).toBeDefined()
    expect(parseInt(session.deathTimeStamp)).toBeGreaterThan(
      new Date().getTime()
    )

    await deleteFolder(session.path)
  })
})
