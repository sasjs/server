import { consola, createConsola } from 'consola'
import { LogLevel, Logger } from '@sasjs/utils/logger'

/**
 * Points the global consola instance at the plain reporter.
 *
 * The default (fancy) reporter measures every line with `string-width`, which
 * calls `Intl.Segmenter`. The executables built by `pkg` embed a small-icu
 * Node, where that call throws and takes the process down - so one log line is
 * enough to stop the server before it listens. The plain reporter renders
 * without measuring, which is why it is always installed rather than chosen
 * from the environment: the packaged binary has no way to detect its way out of
 * the ICU build it carries.
 *
 * Output carries the level in brackets (`[info] ...`, `[error] ...`) in place of
 * an icon. Nothing reads the server's stdout except pm2 and an operator, and
 * stdout is a pipe in both cases, so the fancy reporter had no colour to add
 * there either.
 */
export const instantiateLogger = () => {
  // consola 3 exports no reporter classes, so the plain reporter comes from an
  // instance built with `fancy: false`.
  const plain = createConsola({ fancy: false })

  consola.setReporters(plain.options.reporters)

  const logLevel = (process.env.LOG_LEVEL || LogLevel.Info) as LogLevel
  const logger = new Logger(logLevel)
  process.logger = logger
}
