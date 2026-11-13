import { Response } from 'express'
import { HttpError } from '../utils/httpError'

/** Whether a value is an HTTP status a refusal may answer with. */
const isRefusalStatus = (value: unknown): value is number =>
  typeof value === 'number' &&
  Number.isInteger(value) &&
  value >= 400 &&
  value <= 599

/**
 * A refusal as the client reads it: the status the controller chose, and either
 * its message or a fixed 5xx body.
 *
 * Only this API's own refusals answer a 4xx. A library or a driver error may
 * carry its own `status` or `code` (`ENOENT`, `ECONNREFUSED`, 0, 200, a non-HTTP
 * enum, or a 4xx that means something else entirely), and rendering one as a
 * client refusal would send its internal message to the caller and hide the
 * failure. Those are 500s, logged, like any other unexpected error - and passing
 * a string `code` to `res.status()` would throw ERR_HTTP_INVALID_STATUS_CODE
 * inside the catch block, turning the refusal into a thrown error.
 *
 * A 4xx message is the contract: the corpus pins several of them, and a client
 * keys on them. A 5xx body is not: a stack or a driver message is nothing a
 * client can act on and can carry internals, so the client gets a fixed body and
 * the detail goes to the log.
 *
 * The decision lives here rather than in a response writer because a route that
 * answers a page instead of JSON - the estate's authorization URL is one, since a
 * Viya client parses it - makes the same decision with a different content type.
 */
export const refusalFor = (error: any): { status: number; message: string } => {
  const status =
    error instanceof HttpError && isRefusalStatus(error.status)
      ? error.status
      : 500

  if (status >= 500) {
    process.logger?.error?.(error)

    return { status, message: 'Internal Server Error' }
  }

  return {
    status,
    message:
      error instanceof Error ? error.message : String(error?.message ?? error)
  }
}

/**
 * The decision above, written to a response: the plain-text body a refusal sends.
 *
 * The OAuth token port is the exception and answers its own refusals, in the
 * RFC 6749 shape a Viya client parses - see `routes/viya/token.ts`.
 */
export const sendRefusal = (res: Response, error: any) => {
  const { status, message } = refusalFor(error)

  return res.status(status).send(message)
}
