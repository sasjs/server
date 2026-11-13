/**
 * The emulated Viya estate, mounted at the paths a Viya client uses.
 *
 * An application built for `serverType=SASVIYA` speaks `/compute`, `/folders`,
 * `/files`, `/identities` and `/types`; this server speaks `/SASjsApi`. With
 * `EMULATE_VIYA` set, those paths are answered by `@sasjs/api`'s emulator, whose
 * shapes are recorded from a real estate - so the application talks to the
 * server it has and gets the answers it expects.
 *
 * What is emulated and what is real is worth stating plainly:
 *
 * - **identity, folders, files, and the shape of every answer** come from the
 *   emulator, backed by this server's own drive and identity store, so an
 *   uploaded file is the same file both APIs see;
 * - **execution is real.** The `execute` port runs the submitted program on this
 *   server's engine, so a service returns its own `_webout` and a program that
 *   fails fails.
 *
 * With the flag unset the router passes every request through untouched, so a
 * server talking to a real estate is unchanged.
 */
import express from 'express'
import { readFile } from 'fs/promises'
import { deleteFile } from '@sasjs/utils'
import { dispatchViya } from '@sasjs/api'
import type { Services, ViyaResponse } from '@sasjs/api'

/** The paths a Viya client uses, and the only ones this router answers. */
export const VIYA_PREFIXES = [
  '/compute',
  '/folders',
  '/files',
  '/identities',
  '/types',
  '/SASLogon'
]

/**
 * The guard, scoped to what it protects.
 *
 * Three paths matter and each is here for a reason:
 *
 * - a path outside the estate's prefixes is not the emulator's business, and the
 *   web router behind it must still serve the application shell to a caller
 *   who has not signed in yet;
 * - `/SASLogon` is the estate's own login - a client that signs in the Viya way
 *   never holds a sasjs/server token, so guarding it would mean nobody could
 *   ever obtain one;
 * - everything else runs caller code on this engine, so it is guarded.
 */
export const viyaGuard =
  (authenticate: express.RequestHandler): express.RequestHandler =>
  (req, res, next) => {
    if (!isViyaPath(req.path)) return next()
    if (req.path === LOGON_PATH || req.path.startsWith(`${LOGON_PATH}/`))
      return next()

    return authenticate(req, res, next)
  }

/**
 * The part a multipart request carried, in the shape the emulator reads.
 *
 * `multerSingle` puts the part on disk and describes it; the emulator wants the
 * name the client sent and the bytes, so the file is read back here. Reading it
 * eagerly is what makes an upload visible to the drive before the answer.
 */
const uploadOf = async (
  req: express.Request
): Promise<{ name: string; contents: string | Uint8Array } | undefined> => {
  const part = (
    req as express.Request & { file?: { originalname: string; path: string } }
  ).file

  if (!part) return undefined

  try {
    return { name: part.originalname, contents: await readFile(part.path) }
  } finally {
    // the parser wrote this to the uploads folder; the emulator has the bytes,
    // and every other route that uses the parser deletes its copy
    await deleteFile(part.path).catch(() => undefined)
  }
}

/** Where a Viya client signs in, which the guard leaves open. */
export const LOGON_PATH = '/SASLogon'

/** A request the emulator should not answer is left to the server's own routes. */
export const isViyaPath = (path: string): boolean =>
  VIYA_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  )

/**
 * The router.
 *
 * `services` is a factory rather than a value because a request carries the
 * caller: the estate the emulator answers as depends on who is asking, and a
 * host that resolved one at boot would answer everyone as the same account.
 */
export const createViyaRouter = (
  services: (req: express.Request) => Services
) => {
  const router = express.Router()

  router.use(async (req, res, next) => {
    if (!isViyaPath(req.path)) return next()

    // the emulator answers `POST /files/files` from the multipart part, and this
    // is the parser the rest of the server uses for one. Imported here rather
    // than at the top: the multer helper reads the server's folder layout at
    // module load, and a host that never receives an upload should not need that.
    if (req.method === 'POST' && req.path === '/files/files') {
      const { multerSingle } = await import('../../middlewares/multer')

      // the parser answers a refusal itself rather than calling the `next` it was
      // given, so the promise settles on the response - waiting for `next` would
      // leave the handler pending after the caller had been answered
      await new Promise<void>((resolve) => {
        res.once('finish', () => resolve())
        res.once('close', () => resolve())

        multerSingle('file', [req, res, () => resolve()])
      })

      // a refusal is already answered, in the parser's plain text; nothing below
      // should write a second response
      if (res.headersSent) return
    }

    let answer: ViyaResponse

    try {
      answer = await dispatchViya(services(req), req.method, req.path, {
        query: req.query as Record<string, string | undefined>,
        body: req.body as Record<string, unknown> | undefined,
        file: await uploadOf(req),
        // the scheme is case-insensitive (RFC 7235 2.1), so `bearer <tok>` is a
        // bearer token and not a token that happens to start with the word
        token: (req.headers.authorization ?? '').replace(/^Bearer\s+/i, '')
      })
    } catch (error) {
      return next(error)
    }

    res.status(answer.status)

    Object.entries(answer.headers ?? {}).forEach(([name, value]) =>
      res.setHeader(name, String(value))
    )

    if (answer.contents !== undefined) {
      res.end(answer.contents)

      return
    }

    res.json(answer.body)
  })

  return router
}
