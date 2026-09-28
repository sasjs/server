import { Request } from 'express'

/**
 * Read and discard whatever is left of the request body, resolving once it has
 * all arrived. Resolves immediately for a request that carries none, or whose
 * body a parser has already consumed.
 *
 * Refusing a request whose body is still on the wire resets the connection: the
 * socket is closed with data unread, so the kernel sends RST and the client
 * sees `write EPIPE` instead of the response it was sent. It is an intermittent
 * failure - it depends on whether the client finished writing before the
 * refusal went out - and it is reachable on every early refusal of an upload,
 * because authentication, the permission gate and the CSRF check all run before
 * multer.
 *
 * Awaiting this before responding removes the race. The decision that produced
 * the refusal comes from the headers or the session, never from the body, so
 * nothing is lost by waiting - and a client that abandons the upload is bounded
 * by the server's own request timeout.
 */
export const drainBody = (req: Request): Promise<void> =>
  new Promise((resolve) => {
    if (req.readableEnded || req.complete) return resolve()

    req.on('end', () => resolve())
    // A client that gave up must not leave the response hanging.
    req.on('aborted', () => resolve())
    req.on('error', () => resolve())

    req.resume()
  })
