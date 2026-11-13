import { Response } from 'express'
import { HttpError } from '../utils/httpError'

/**
 * A refusal as the client reads it: the status the controller chose, and either
 * its message or a fixed 5xx body.
 *
 * `code` is only an HTTP status when it is one. A Node system error carries a
 * string `code` (`ENOENT`, `ECONNREFUSED`), and passing that to `res.status()`
 * throws ERR_HTTP_INVALID_STATUS_CODE inside the catch block - so the refusal
 * becomes a thrown error rather than a response.
 *
 * A 4xx message is the contract: the corpus pins several of them, and a client
 * keys on them. A 5xx body is not: a stack or a driver message is nothing a
 * client can act on and can carry internals, so the client gets a fixed body and
 * the detail goes to the log.
 */
/** Whether a value is an HTTP status a refusal may answer with. */
const isRefusalStatus = (value: unknown): value is number =>
  typeof value === 'number' &&
  Number.isInteger(value) &&
  value >= 400 &&
  value <= 599

/**
 * The status and body a refusal answers with, for a caller that writes its own
 * response.
 *
 * A route that answers a page rather than JSON - the estate's authorization URL
 * is one, because a Viya client parses it - still has to make the same decision:
 * only this API's own refusals answer a 4xx, and a 5xx body carries no driver
 * message.
 */
export const refusalFor = (error: any): { status: number; message: string } => {
  // Only this API's own refusals answer a 4xx. A library or a driver error may
  // carry its own `status` or `code` (0, 200, a non-HTTP enum, or a 4xx that
  // means something else entirely), and rendering one as a client refusal would
  // send its internal message to the caller and hide the failure. Those are 500s,
  // logged, like any other unexpected error.
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

export const sendRefusal = (res: Response, error: any) => {
  const { status, message } = refusalFor(error)

  return res.status(status).send(message)
}
