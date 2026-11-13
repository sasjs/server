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

    let answer: ViyaResponse

    try {
      answer = await dispatchViya(services(req), req.method, req.path, {
        query: req.query as Record<string, string | undefined>,
        body: req.body as Record<string, unknown> | undefined,
        // a host that parses multipart puts the part here; nothing else does
        file: (
          req as express.Request & {
            file?: { name: string; contents: string | Uint8Array }
          }
        ).file,
        token: (req.headers.authorization ?? '').replace(/^Bearer /, '')
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
