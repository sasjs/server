import path from 'path'
import os from 'os'
import { spawn, ChildProcess } from 'child_process'
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
    path: path.join(getSessionsFolder(), sessionId),
    owner: 'testUser'
  }
}

const scheduleDestroy = (controller: SessionController, session: Session) =>
  (controller as any).scheduleSessionDestroy(session)

const track = (controller: SessionController, session: Session) =>
  (controller as any).sessions.push(session)

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * A process that stays alive until it is stopped, so a session can be given a
 * pid that genuinely resolves - `process.pid` (the jest worker) would prove
 * nothing about a *session's* process.
 */
const spawnLiveProcess = (): ChildProcess =>
  spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
    stdio: 'ignore'
  })

const stopProcess = (child: ChildProcess): Promise<void> =>
  new Promise((resolve) => {
    if (child.exitCode !== null || child.signalCode !== null) return resolve()

    child.once('exit', () => resolve())

    child.kill('SIGKILL')
  })

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

  it('keeps a session whose death time moved while the timer was armed', async () => {
    const session = makeSession(400, SessionState.completed)
    await createFile(path.join(session.path, 'log.log'), 'some log')
    track(controller, session)

    scheduleDestroy(controller, session)

    // a caller that keeps naming the session pushes its death time forward, and
    // the timer that was armed before that must not delete the folder anyway -
    // the folder holds the webout and the log the client's links point at
    await delay(200)
    session.deathTimeStamp = (new Date().getTime() + 400).toString()

    await delay(300)
    expect(await folderExists(session.path)).toEqual(true)
    expect(controller.getSessionById(session.id)).toBeDefined()

    // and it still goes when the new death time arrives, so the push is a delay
    // and not a leak
    await delay(700)
    expect(await folderExists(session.path)).toEqual(false)
  })

  /**
   * The destroy timer is due a quarter of an hour after the session is created,
   * and nothing waits for it. Armed with a reference, it keeps the event loop
   * alive for its whole duration: a test run that triggered one session then sat
   * there until the kernel killed it (sasjs/server#577), and anything else that
   * triggered a session and finished would do the same. Unref'd, a server still
   * fires it - the listening sockets hold the loop open - and a process with
   * nothing else to do can exit.
   */
  it('does not hold the process open for the session lifetime', () => {
    const session = makeSession(15 * 60 * 1000, SessionState.pending)
    const spy = jest.spyOn(global, 'setTimeout')

    try {
      scheduleDestroy(controller, session)

      const timer = spy.mock.results[0].value as NodeJS.Timeout
      expect(timer.hasRef()).toEqual(false)
    } finally {
      spy.mockRestore()
    }
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

  // The retention window is documented as counting from completion, and a
  // completed session is the case a caller polls for: excluding that state, as
  // this used to, meant the request could never take effect and the log and
  // output of a triggered program were deleted at creation + 15 minutes
  // however long the caller asked to keep them.
  it('keeps a completed session for the retention window the caller asked for', async () => {
    const session = makeSession(300, SessionState.completed)
    session.expiresAfterMins = { mins: 0.02, used: false }

    await createFile(path.join(session.path, 'log.log'), 'the only copy')
    track(controller, session)

    scheduleDestroy(controller, session)
    await delay(900)

    // past its death time, still readable
    expect(await folderExists(session.path)).toEqual(true)
    expect(controller.getSessionById(session.id)).toBeDefined()
    expect(session.expiresAfterMins!.used).toEqual(true)

    // and gone once the window is spent, so it is a delay and not a leak
    await delay(2000)
    expect(await folderExists(session.path)).toEqual(false)
    expect(controller.getSessionById(session.id)).toBeUndefined()
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

  // sasjs/server#162: a session whose folder is deleted while its process is
  // still running crashes with `Failed to open .../code.sas`, because the SYSIN
  // it is waiting for is taken away underneath it. The state is not a reliable
  // answer here - the destroy can fire while a session is still `pending` - so a
  // live process has to keep the session alive on its own.
  it('keeps a session whose process is still alive, whatever its state says', async () => {
    const child = spawnLiveProcess()

    try {
      const session = makeSession(300, SessionState.pending)
      session.pid = child.pid

      await createFile(path.join(session.path, 'log.log'), 'running')
      track(controller, session)

      const originalDeathTimeStamp = session.deathTimeStamp

      scheduleDestroy(controller, session)
      await delay(900)

      expect(await folderExists(session.path)).toEqual(true)
      expect(controller.getSessionById(session.id)).toBeDefined()
      expect(parseInt(session.deathTimeStamp)).toBeGreaterThan(
        parseInt(originalDeathTimeStamp)
      )

      await deleteFolder(session.path)
    } finally {
      await stopProcess(child)
    }
  })

  it('destroys a session whose process has exited, even with a pid recorded', async () => {
    const child = spawnLiveProcess()
    const pid = child.pid

    await stopProcess(child)

    const session = makeSession(300, SessionState.pending)
    session.pid = pid

    await createFile(path.join(session.path, 'log.log'), 'finished')
    track(controller, session)

    scheduleDestroy(controller, session)
    await delay(900)

    expect(await folderExists(session.path)).toEqual(false)
    expect(controller.getSessionById(session.id)).toBeUndefined()
  })
})
