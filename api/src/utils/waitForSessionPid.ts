import { Session } from '../types'
import { RunTimeType } from './verifyEnvVariables'

/**
 * Resolves the pid of the process running a session.
 *
 * `spawned` is resolved by the code that creates the process, so this waits on
 * an event rather than polling: the spawn already knows the answer the moment
 * it has one.
 *
 * A pre-warmed SAS session carries its pid before the trigger is served, since
 * the process starts with the session. `sasviya` never produces one - the
 * program runs on the Viya server, and its promise resolves when that job
 * completes rather than when a local process starts, so waiting would charge
 * every trigger the full timeout for a value that cannot arrive.
 *
 * The program promise is observed before either of those returns: a rejection
 * still has to be reported rather than left unhandled, whichever branch the
 * caller takes.
 */
export const waitForSessionPid = async (
  session: Session,
  spawned: Promise<number | undefined>,
  program: Promise<unknown>,
  runTime: RunTimeType,
  timeoutMs = 2000
): Promise<number | undefined> => {
  // attached first, so no path through this function can leave the program
  // promise unobserved
  const finished = program.then(
    () => undefined,
    (err: any) => {
      process.logger.error(
        'triggered program failed',
        session.id,
        err?.message ?? String(err)
      )

      return undefined
    }
  )

  if (session.pid) return session.pid

  if (runTime === RunTimeType.SASVIYA) return undefined

  let timer: NodeJS.Timeout
  const timedOut = new Promise<undefined>((resolve) => {
    timer = setTimeout(() => resolve(undefined), timeoutMs)
  })

  try {
    return await Promise.race([spawned, finished, timedOut])
  } finally {
    // the common path answers in microseconds; the timer must not outlive it
    clearTimeout(timer!)
  }
}
