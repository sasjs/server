import { inspect } from 'util'

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
 * @returns a function that removes the listeners again, for tests and for an
 * embedder that supplies its own.
 */
export const installFatalGuards = (): (() => void) => {
  const fatal =
    (kind: string) =>
    (reason: unknown, _promise?: Promise<unknown>): void => {
      process.logger.error(
        `[server] fatal: ${kind} - the process is exiting\n${describe(reason)}`
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
