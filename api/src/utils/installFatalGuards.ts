import { writeSync } from 'fs'
import { inspect } from 'util'

const RETRY_PAUSE_MS = 5

/** A synchronous sleep: `Atomics.wait` is the only blocking wait on the main thread. */
const pauseCell = new Int32Array(new SharedArrayBuffer(4))

const pause = (): string => Atomics.wait(pauseCell, 0, 0, RETRY_PAUSE_MS)

/** The stack of an Error, the value itself for a string, and an inspection otherwise. */
const describe = (reason: unknown): string => {
  if (reason instanceof Error)
    return reason.stack ?? `${reason.name}: ${reason.message}`

  if (typeof reason === 'string') return reason

  try {
    return inspect(reason, { depth: 3 })
  } catch {
    return String(reason)
  }
}

/**
 * Writes the line synchronously to stderr.
 *
 * `process.logger` and the console transports reach stderr through a stream, and
 * a stream write to a pipe is asynchronous on POSIX - which is what stderr is
 * under journald, `pm2 logs` and a Task Scheduler output file. The `exit` that
 * follows can therefore pre-empt the write, and the diagnosis is the one thing
 * this path exists to deliver. `writeSync` on fd 2 has landed by the time the
 * next statement runs.
 *
 * The logger is the fallback rather than the primary because it also carries the
 * configured log level: a fatal error is not something to filter out.
 *
 * A partial write leaves the remainder for the next attempt. `EAGAIN` - a pipe
 * with no room right now - is retried a bounded number of times, with a few
 * milliseconds between attempts so the reader on the other end can drain it.
 * Anything still unwritten after that goes to the logger as a best effort: a
 * pipe that stays full cannot be written to synchronously at all, and blocking
 * indefinitely on a fatal path is worse than a line that may not land.
 */
const writeFatal = (line: string): void => {
  let pending = Buffer.from(line)

  const fallback = (remaining: Buffer): void => {
    if (remaining.length) process.logger?.error(remaining.toString())
  }

  for (let attempt = 0; attempt < 3 && pending.length; attempt++) {
    if (attempt) pause()

    try {
      // a partial write leaves the remainder for the next attempt
      pending = pending.subarray(writeSync(2, pending))
    } catch (error: any) {
      // EAGAIN is a pipe with no room right now, not a broken stderr
      if (error?.code !== 'EAGAIN') {
        fallback(pending)

        return
      }
    }
  }

  fallback(pending)
}

/**
 * Turns the process's own death into a log entry, then ends the process.
 *
 * Node ends a process on an unhandled rejection or an uncaught exception and
 * prints the reason to stderr. Installing a listener replaces that default, so
 * every handler here logs first and calls `process.exit(1)` - without the exit
 * the server would carry on after a fault it cannot see the extent of, and this
 * process executes uploaded code, so a half-finished permission check is not a
 * state to keep serving from.
 *
 * The log entry is the point: a double-clicked executable closes its console
 * window with the crash, which is why a stoppage reads as "no message or
 * warning" (sasjs/server#320). Whatever collects stderr - journald, `pm2 logs`,
 * a Task Scheduler output file - now gets a line that names the event as well
 * as the stack.
 *
 * Neither handler depends on `process.logger` being set, so the guards can be
 * installed before the app initialises.
 *
 * @returns a function that removes the listeners again, for tests and for an
 * embedder that supplies its own.
 */
export const installFatalGuards = (): (() => void) => {
  const fatal =
    (kind: string) =>
    (reason: unknown, _promise?: Promise<unknown>): void => {
      writeFatal(
        `[server] fatal: ${kind} - the process is exiting\n${describe(reason)}\n`
      )
      process.exit(1)
    }

  const onRejection = fatal('unhandled promise rejection')
  const onException = fatal('uncaught exception')

  process.on('unhandledRejection', onRejection)
  process.on('uncaughtException', onException)

  return () => {
    process.removeListener('unhandledRejection', onRejection)
    process.removeListener('uncaughtException', onException)
  }
}
