import { writeSync } from 'fs'
import { inspect } from 'util'

const RETRY_PAUSE_MS = 5

/**
 * How long a line that only reached the logger is given to flush before the
 * process goes. The logger writes through a stream, so an immediate exit can
 * pre-empt it - but a wedged transport must not keep a faulted process alive.
 */
const FALLBACK_EXIT_MS = 150

/** A synchronous sleep: `Atomics.wait` is the only blocking wait on the main thread. */
const pauseCell = new Int32Array(new SharedArrayBuffer(4))

const pause = (): void => {
  Atomics.wait(pauseCell, 0, 0, RETRY_PAUSE_MS)
}

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
 * Whatever does not land is then logged in full rather than as the tail: a torn
 * prefix may already be on stderr, and a complete second copy reads better than
 * one message split across two sinks with different framing and filtering. A
 * pipe that stays full cannot be written to synchronously at all, and blocking
 * indefinitely on a fatal path is worse than a line that may not land.
 *
 * @returns whether the whole line reached fd 2 - the caller decides how to exit
 * from that, because the logger fallback is a stream write the exit would race.
 */
const writeFatal = (line: string): boolean => {
  let pending = Buffer.from(line)

  for (let attempt = 0; attempt < 3 && pending.length; attempt++) {
    if (attempt) pause()

    try {
      // a partial write leaves the remainder for the next attempt
      pending = pending.subarray(writeSync(2, pending))
    } catch (error: any) {
      // EAGAIN is a pipe with no room right now, not a broken stderr
      if (error?.code !== 'EAGAIN') break
    }
  }

  if (!pending.length) return true

  process.logger?.error(line)

  return false
}

/**
 * Turns the process's own death into a log entry, then ends the process.
 *
 * Node ends a process on an unhandled rejection or an uncaught exception and
 * prints the reason to stderr. Installing a listener replaces that default, so
 * every handler here logs first and then ends the process - without that the
 * server would carry on after a fault it cannot see the extent of, and this
 * process executes uploaded code, so a half-finished permission check is not a
 * state to keep serving from.
 *
 * How it ends depends on how the line went out. A line that reached fd 2
 * synchronously is on the terminal already, so the exit can be immediate. A
 * line that only reached the logger is on a stream write that an immediate exit
 * would pre-empt - the diagnosis lost in exactly the case the fallback exists
 * for - so the guards are removed, the exit code is set, and the exit is
 * scheduled a moment later. Removing the listeners first means a second fault
 * during that window falls through to Node's own handler rather than re-entering
 * this one, and the timer is unref'd so an otherwise idle process still exits.
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
  const removeGuards = () => {
    process.removeListener('unhandledRejection', onRejection)
    process.removeListener('uncaughtException', onException)
  }

  const fatal =
    (kind: string) =>
    (reason: unknown, _promise?: Promise<unknown>): void => {
      const delivered = writeFatal(
        `[server] fatal: ${kind} - the process is exiting\n${describe(reason)}\n`
      )

      if (delivered) {
        process.exit(1)

        return
      }

      // the logger holds the only copy, on a stream write: give it a turn to
      // land, and bound the wait so a wedged transport cannot keep a faulted
      // process alive
      removeGuards()
      process.exitCode = 1
      setTimeout(() => process.exit(1), FALLBACK_EXIT_MS).unref()
    }

  const onRejection = fatal('unhandled promise rejection')
  const onException = fatal('uncaught exception')

  process.on('unhandledRejection', onRejection)
  process.on('uncaughtException', onException)

  return removeGuards
}
