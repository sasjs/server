import { waitForSessionPid } from '../waitForSessionPid'
import { RunTimeType } from '../verifyEnvVariables'
import { Session, SessionState } from '../../types'

const makeSession = (pid?: number): Session => ({
  id: 'session-1',
  state: SessionState.running,
  creationTimeStamp: '0',
  deathTimeStamp: '0',
  path: '/tmp/session-1',
  pid
})

const never = () => new Promise<number | undefined>(() => undefined)

describe('waitForSessionPid', () => {
  it('returns a pid the session already carries, without waiting', async () => {
    const started = Date.now()

    const pid = await waitForSessionPid(
      makeSession(4242),
      never(),
      new Promise(() => undefined),
      RunTimeType.SAS
    )

    expect(pid).toEqual(4242)
    expect(Date.now() - started).toBeLessThan(100)
  })

  it('returns the pid reported by the spawn', async () => {
    let report: (pid: number) => void = () => undefined

    const spawned = new Promise<number | undefined>((resolve) => {
      report = resolve
    })

    setTimeout(() => report(5151), 20)

    const pid = await waitForSessionPid(
      makeSession(),
      spawned,
      new Promise(() => undefined),
      RunTimeType.JS
    )

    expect(pid).toEqual(5151)
  })

  // sasviya runs the program on the Viya server: there is no local process,
  // and its promise resolves only when that job completes. Waiting for it would
  // charge every trigger the full timeout for a value that cannot arrive.
  it('returns undefined immediately for a runtime with no local process', async () => {
    const started = Date.now()

    const pid = await waitForSessionPid(
      makeSession(),
      never(),
      new Promise(() => undefined),
      RunTimeType.SASVIYA
    )

    expect(pid).toBeUndefined()
    expect(Date.now() - started).toBeLessThan(100)
  })

  it('stops waiting when the program finishes without a pid', async () => {
    const started = Date.now()

    const pid = await waitForSessionPid(
      makeSession(),
      never(),
      new Promise((resolve) => setTimeout(resolve, 20)),
      RunTimeType.PY
    )

    expect(pid).toBeUndefined()
    expect(Date.now() - started).toBeLessThan(1000)
  })

  it('gives up after the timeout when nothing happens', async () => {
    const started = Date.now()

    const pid = await waitForSessionPid(
      makeSession(),
      never(),
      new Promise(() => undefined),
      RunTimeType.R,
      100
    )

    expect(pid).toBeUndefined()
    expect(Date.now() - started).toBeGreaterThanOrEqual(100)
  })

  // The program promise is observed before the early returns, so a rejection
  // from a runtime that needs no waiting is still reported rather than left as
  // an unhandled rejection.
  it('observes the program even when it returns without waiting', async () => {
    // the logger is installed by app startup, which this unit spec does not
    // run, so it is provided for the duration of the test
    const originalLogger = process.logger
    const errorSpy = jest.fn()

    ;(process as any).logger = { ...(originalLogger ?? {}), error: errorSpy }

    const program = new Promise((_resolve, reject) =>
      setTimeout(() => reject(new Error('viya job failed')), 10)
    )

    const pid = await waitForSessionPid(
      makeSession(4242),
      never(),
      program,
      RunTimeType.SASVIYA
    )

    expect(pid).toEqual(4242)

    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(errorSpy).toHaveBeenCalledWith(
      'triggered program failed',
      'session-1',
      'viya job failed'
    )

    ;(process as any).logger = originalLogger
  })
})
