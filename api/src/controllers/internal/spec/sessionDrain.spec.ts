import path from 'path'
import os from 'os'
import { spawn, ChildProcess } from 'child_process'
import {
  createFile,
  deleteFolder,
  fileExists,
  folderExists,
  generateTimestamp,
  readFile
} from '@sasjs/utils'
import {
  isProcessAlive,
  readProcessStartTime,
  SessionController,
  SASSessionController
} from '../Session'
import { Session, SessionState } from '../../../types'
import { getSessionsFolder, generateUniqueFileName } from '../../../utils'

/**
 * Shutting the server down must not leave session processes behind.
 *
 * A session *is* an OS process - a pooled SAS process parked in its autoexec loop,
 * or the interpreter running a program - and exiting the server used to orphan all
 * of them. These specs use real child processes rather than a mocked `kill`,
 * because the behaviour under test is what happens to a live process and when its
 * folder may be removed.
 */
/** A drain budget whose phases can be shortened, so the specs stay quick. */
const budget = (graceMs = 100, sigtermMs = 1000, sigkillMs = 1000) => ({
  graceMs,
  sigtermMs,
  sigkillMs
})

// `/proc` is Linux only, and the pid-identity check depends on it - on macOS and
// Windows there is nothing to compare, so that spec would assert the opposite of
// the documented fallback.
const itOnLinux = readProcessStartTime(process.pid) ? it : it.skip

const makeSession = (state: SessionState): Session => {
  const sessionId = generateUniqueFileName(generateTimestamp())
  const creationTimeStamp = sessionId.split('-').pop() as string

  return {
    id: sessionId,
    state,
    creationTimeStamp,
    deathTimeStamp: (new Date().getTime() + 60_000).toString(),
    path: path.join(getSessionsFolder(), sessionId),
    owner: 'testUser'
  }
}

const track = (controller: SessionController, session: Session) =>
  (controller as any).sessions.push(session)

/** A process that stays up until it is signalled or killed. */
const spawnLiveProcess = (
  script = 'setInterval(() => {}, 1000)'
): ChildProcess => spawn(process.execPath, ['-e', script], { stdio: 'ignore' })

/** A process that ignores SIGTERM, so the escalation to SIGKILL is exercised. */
const spawnStubbornProcess = (): Promise<ChildProcess> =>
  new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [
        '-e',
        "process.on('SIGTERM', () => {}); process.stdout.write('ready'); setInterval(() => {}, 1000)"
      ],
      { stdio: ['ignore', 'pipe', 'ignore'] }
    )

    // the handler is installed before 'ready' is written, so waiting for the
    // marker is what makes the SIGTERM below genuinely ignorable - a signal sent
    // to a node process that has not reached its handler yet ends it, and the
    // escalation this spec asserts would never run
    child.stdout!.once('data', () => resolve(child))
    child.stdout!.once('error', reject)
  })

const waitForExit = (child: ChildProcess): Promise<void> =>
  new Promise((resolve) => {
    if (child.exitCode !== null || child.signalCode !== null) return resolve()

    child.once('exit', () => resolve())
  })

const stopProcess = async (child: ChildProcess) => {
  if (child.exitCode === null && child.signalCode === null)
    child.kill('SIGKILL')

  await waitForExit(child)
}

describe('session drain', () => {
  let controller: SessionController

  beforeAll(() => {
    const root = path.join(
      os.tmpdir(),
      `sasjs-session-drain-spec-${generateTimestamp()}`
    )
    process.sasjsRoot = root
    process.driveLoc = path.join(root, 'drive')
  })

  beforeEach(() => {
    controller = new SessionController()
    process.logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    } as any
  })

  it('removes the folder of a session whose process has already gone', async () => {
    const session = makeSession(SessionState.completed)
    await createFile(path.join(session.path, 'log.log'), 'finished')
    track(controller, session)

    await controller.drain(budget(1000))

    expect(await folderExists(session.path)).toEqual(false)
    expect(controller.getSessionById(session.id)).toBeUndefined()
  })

  it('waits for a session that is finishing by itself, then removes its folder', async () => {
    const child = spawnLiveProcess('setTimeout(() => process.exit(0), 200)')

    try {
      const session = makeSession(SessionState.running)
      session.pid = child.pid

      await createFile(path.join(session.path, 'log.log'), 'still running')
      track(controller, session)

      await controller.drain(budget(2000))

      // the run finished on its own, so nothing had to be signalled...
      expect(process.logger.warn).not.toHaveBeenCalled()

      // ...and the folder went once the process was gone
      expect(await folderExists(session.path)).toEqual(false)
    } finally {
      await stopProcess(child)
    }
  })

  // sasjs/server#162: the folder is where the process's SYSIN and log live, so
  // removing it before the process has stopped is what produced the
  // `Failed to open .../code.sas` crash. The removal has to come after the exit.
  it('signals a session that outlives its grace, and removes the folder only once it is gone', async () => {
    const child = await spawnStubbornProcess()

    try {
      const session = makeSession(SessionState.running)
      session.pid = child.pid

      await createFile(path.join(session.path, 'log.log'), 'runaway')
      track(controller, session)

      await controller.drain(budget())

      // SIGTERM was ignored, so the escalation ran and the process is really gone
      expect(isProcessAlive(session.pid)).toEqual(false)

      // and the non-zero exit that follows is attributed to the shutdown rather
      // than logged as a crash (which is what sasjs/server#162 complains about)
      expect(session.terminatedByShutdown).toEqual(true)

      expect(process.logger.warn).toHaveBeenCalledTimes(2)
      expect(process.logger.warn).toHaveBeenLastCalledWith(
        'session ignored SIGTERM, killing',
        session.id,
        session.pid
      )

      expect(await folderExists(session.path)).toEqual(false)
    } finally {
      await stopProcess(child)
    }
  })

  it('drains every session it holds, in parallel', async () => {
    const children = await Promise.all([
      spawnStubbornProcess(),
      spawnStubbornProcess()
    ])

    try {
      const sessions = [0, 1].map(() => {
        const session = makeSession(SessionState.running)
        track(controller, session)

        return session
      })

      sessions.forEach((session, index) => {
        session.pid = children[index].pid
      })

      const started = new Date().getTime()

      await controller.drain(budget(100, 800, 800))

      // two graces in sequence would be 2x the deadline; parallel is one
      expect(new Date().getTime() - started).toBeLessThan(2500)

      for (const session of sessions) {
        expect(isProcessAlive(session.pid)).toEqual(false)
        expect(await folderExists(session.path)).toEqual(false)
      }
    } finally {
      await Promise.all(children.map(stopProcess))
    }
  })

  it('does nothing when it holds no sessions', async () => {
    await controller.drain(budget())

    expect(process.logger.info).not.toHaveBeenCalled()
  })

  // A pid is only unique while its process lives. If the OS has handed the number
  // to something else, signalling it would hit an unrelated process - another
  // session's interpreter, or the supervisor's own child.
  itOnLinux(
    'does not signal a pid that another process has taken over',
    async () => {
      const child = await spawnStubbornProcess()

      try {
        const session = makeSession(SessionState.running)
        session.pid = child.pid
        // a start time that cannot belong to this child, i.e. the pid was reused
        session.pidStartedAt = '0'

        await createFile(path.join(session.path, 'log.log'), 'not ours')
        track(controller, session)

        await controller.drain(budget(100, 500, 500))

        // nothing was sent: the process is still up, and no signal was logged
        expect(isProcessAlive(child.pid)).toEqual(true)
        expect(process.logger.warn).not.toHaveBeenCalled()

        // and the folder goes, because no live process of ours owns it
        expect(await folderExists(session.path)).toEqual(false)
      } finally {
        await stopProcess(child)
      }
    }
  )

  // The process survives SIGTERM *and* SIGKILL only when it is stuck in
  // uninterruptible I/O, which cannot be simulated portably - so the contract of
  // the branch is asserted: whatever terminate() reports decides the folder.
  it('leaves the folder in place when the process survives both signals', async () => {
    const session = makeSession(SessionState.running)
    session.pid = 4242

    await createFile(path.join(session.path, 'log.log'), 'stuck in i/o')
    track(controller, session)

    jest.spyOn(controller as any, 'waitForProcessExit').mockResolvedValue(false)
    jest.spyOn(controller as any, 'terminate').mockResolvedValue(false)

    await controller.drain()

    // the folder is where the session is still writing: removing it is the very
    // crash sasjs/server#162 reports
    expect(await folderExists(session.path)).toEqual(true)
    expect(process.logger.error).toHaveBeenCalledWith(
      'session did not stop, so its folder was left in place',
      session.id,
      session.pid
    )

    await deleteFolder(session.path)
  })
})

describe('draining a SAS session', () => {
  let controller: SASSessionController

  beforeAll(() => {
    const root = path.join(
      os.tmpdir(),
      `sasjs-sas-session-drain-spec-${generateTimestamp()}`
    )
    process.sasjsRoot = root
    process.driveLoc = path.join(root, 'drive')
  })

  beforeEach(() => {
    controller = new SASSessionController()
    process.logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    } as any
  })

  // The whole point of the graceful path: a waiting SAS session is handed the
  // program it is watching for, exactly as a real program is, so SAS ends the run
  // itself and the log says why. `%put` alone (as sasjs/server#162 proposes)
  // relies on SYSIN EOF; `endsas;` does not.
  it('hands a waiting session a complete endsas program', async () => {
    const session = makeSession(SessionState.pending)
    await createFile(path.join(session.path, 'stpsrv_header.txt'), '')

    await (controller as any).requestSessionEnd(session)

    const codePath = path.join(session.path, 'code.sas')

    expect(await fileExists(codePath)).toEqual(true)
    expect(await readFile(codePath)).toContain('endsas;')

    // create-then-rename, so SAS never reads a partly written program
    expect(await fileExists(`${codePath}.shutdown`)).toEqual(false)

    await deleteFolder(session.path)
  })

  it('wakes a pending session rather than killing it', async () => {
    const child = spawnLiveProcess()

    try {
      const session = makeSession(SessionState.pending)
      session.pid = child.pid
      track(controller, session)

      const requestEnd = jest.spyOn(controller as any, 'requestSessionEnd')

      // the child does not react to the program, so the signal is what ends it -
      // the point here is that it was asked first
      await controller.drain(budget(100, 500, 500))

      expect(requestEnd).toHaveBeenCalledWith(session)
      expect(isProcessAlive(session.pid)).toEqual(false)
    } finally {
      await stopProcess(child)
    }
  })

  // An initialising session still has the dummy SYSIN, which the autoexec deletes
  // before it starts watching - a program written now would be thrown away, and
  // the session would fall through to the signal after a pointless wait.
  it('does not try to wake a session that is still initialising', async () => {
    const child = spawnLiveProcess()

    try {
      const session = makeSession(SessionState.initialising)
      session.pid = child.pid
      track(controller, session)

      const requestEnd = jest.spyOn(controller as any, 'requestSessionEnd')

      await controller.drain(budget(100, 500, 500))

      expect(requestEnd).not.toHaveBeenCalled()
      expect(isProcessAlive(session.pid)).toEqual(false)
    } finally {
      await stopProcess(child)
    }
  })
})
