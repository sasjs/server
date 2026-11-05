import { Response } from 'express'

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
export const sendRefusal = (res: Response, error: any) => {
  const code = error?.code
  const status =
    typeof error?.status === 'number'
      ? error.status
      : Number.isInteger(code) && code >= 400 && code <= 599
        ? (code as number)
        : 500

  if (status >= 500) {
    process.logger?.error?.(error)
    return res.status(status).send('Internal Server Error')
  }

  return res
    .status(status)
    .send(
      error instanceof Error ? error.message : String(error?.message ?? error)
    )
}
