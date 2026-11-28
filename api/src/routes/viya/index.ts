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
 *   fails fails;
 * - **the token port is the server's own.** `/SASLogon/oauth/token` is answered
 *   here (see `token.ts`) rather than by the emulator: the credential is this
 *   server's, and the emulator has no account to check it against.
 *
 * With the flag unset the router passes every request through untouched, so a
 * server talking to a real estate is unchanged.
 */
import express from 'express'
import { readFile } from 'fs/promises'
import { deleteFile } from '@sasjs/utils'
import { dispatchViya, emulatedHeaders } from '@sasjs/api'
import type { Services, ViyaResponse } from '@sasjs/api'

import { oauthToken, TOKEN_PATH } from './token'
import { subjectOf } from './services'
import { addJesMembers, localJesEnabled } from './localJes'
import { VIYA_CONTENT_BYTES, VIYA_CONTENT_PATH } from '../../app-modules'
import { hasRoutePermission } from '../../middlewares/authorize'
import { grantDefinitionAccess, hasDefinitionAccess } from './definitionAccess'

// Not a request field: callers cannot supply or overwrite this decision.
const metadataAccess = new WeakMap<express.Request, boolean>()
const isDefinition = (path: string) => /^\/jobDefinitions(?:\/|$)/i.test(path)
// The API's reserved filename namespace. Filter before dispatch, not from its
// response: older releases ignore readJobDefinitionMetadata and paging happens
// inside the dispatcher. This also prevents metadata reads on newer releases.
const isReservedDefinition = (name: string) => /^\.sasjs-viya-job-/i.test(name)
const isMembers = (path: string, method: string) =>
  method === 'GET' && /^\/folders\/folders\/[^/]+\/members\/*$/i.test(path)

/**
 * The paths a Viya client uses, and the only ones this router answers.
 *
 * `/SASLogon` is deliberately not among them. The emulator carries one operation
 * under that prefix - the token port - and this server answers that itself, while
 * the sign-in routes beside it (`/SASLogon/login`, `/SASLogon/authorize`) are the
 * web router's. Listing the prefix here would swallow them and answer `404 No
 * operation is emulated`, which leaves a client unable to obtain the code the
 * `authorization_code` grant exchanges.
 */
export const VIYA_PREFIXES = [
  '/compute',
  '/folders',
  '/files',
  '/jobDefinitions',
  '/identities',
  '/types'
]

// Express gives strings such as 'route' and 'router' control flow semantics.
// An authentication failure must only enter error handling.
const authenticationError = (error: unknown): Error =>
  error instanceof Error ? error : new Error('Viya authentication failed')

/**
 * The guard, scoped to what it protects.
 *
 * Three paths matter and each is here for a reason:
 *
 * - a path outside the estate's prefixes is not the emulator's business, and the
 *   web router behind it must still serve the application shell to a caller
 *   who has not signed in yet;
 * - `/SASLogon` is not the estate's path at all (see `VIYA_PREFIXES`): the login
 *   and the token port are this server's own routes, and the sign-in is exactly
 *   the caller who holds no token yet;
 * - everything else runs caller code on this engine, so it is guarded.
 */
export const viyaGuard =
  (
    authenticate: express.RequestHandler,
    /** The permission gate, run with `req.url` set to the API rule's path. */
    decide: express.RequestHandler,
    /** A non-responding metadata permission check, not a second middleware gate. */
    metadataDecision: (
      req: express.Request
    ) => Promise<boolean> = hasRoutePermission
  ): express.RequestHandler =>
  async (req, res, next) => {
    if (!isViyaPath(req.path)) return next()

    // Authentication middleware need not return the result of calling next.
    const afterAuthentication = async (error?: unknown) => {
      if (error != null) return next(authenticationError(error))

      const members = isMembers(req.path, req.method)
      if (members) metadataAccess.set(req, false)
      const rules = rulesFor(req.path, req.method)
      if (!rules.length) return next()

      // Each Drive operation has its own route grant. A definition operation
      // composes several of them; every grant must pass before dispatch.
      const url = req.url
      const baseUrl = req.baseUrl
      const restoreRequestPath = () => {
        req.url = url
        req.baseUrl = baseUrl
      }
      const check = async (index: number): Promise<void> => {
        if (index === rules.length) {
          if (members) {
            req.url = '/SASjsApi/drive/file'
            req.baseUrl = ''
            try {
              metadataAccess.set(req, (await metadataDecision(req)) === true)
            } catch {
              // Failure to decide is never a grant.
              metadataAccess.set(req, false)
            } finally {
              restoreRequestPath()
            }
          }
          if (isDefinition(req.path)) grantDefinitionAccess(req)
          return next()
        }
        req.url = rules[index]
        req.baseUrl = ''
        try {
          await decide(req, res, (error?: unknown) => {
            restoreRequestPath()
            if (error != null) return next(authenticationError(error))
            // Middleware is not required to return its continuation's promise.
            void check(index + 1)
          })
        } catch (error) {
          restoreRequestPath()
          next(
            error instanceof Error
              ? error
              : new Error('Viya permission check failed')
          )
        }
      }
      await check(0)
    }

    try {
      await authenticate(req, res, afterAuthentication)
    } catch (error) {
      return next(authenticationError(error))
    }
  }

/**
 * The API rule a Viya path stands for.
 *
 * The estate's paths carry the same capability under different names: a job
 * submission runs arbitrary code, which is `/SASjsApi/code/execute`; a file route
 * reads or writes the drive, which is `/SASjsApi/drive/file`. Deciding on the
 * Viya path itself would pass every caller, because it is in no rule's inventory.
 */
export const ruleFor = (path: string): string | undefined => {
  if (path.startsWith('/files/')) return '/SASjsApi/drive/file'
  if (path.startsWith('/folders/')) return '/SASjsApi/drive/folder'
  if (/\/jobs$/.test(path)) return '/SASjsApi/code/execute'
  if (path.startsWith('/compute/')) return '/SASjsApi/code/execute'
  if (path.startsWith('/jobDefinitions/')) return '/SASjsApi/drive/file'
  if (path.startsWith('/jobExecution/')) return '/SASjsApi/code/execute'

  return undefined
}

/** Keep the tree grant until the dependency's list-only traversal is released.
 * Definitions also require folder listings and file reads/writes. */
const rulesFor = (path: string, method: string): string[] => {
  const file = '/SASjsApi/drive/file'
  const folder = '/SASjsApi/drive/folder'
  const tree = '/SASjsApi/drive/fileTree'
  if (isDefinition(path)) return [file, tree, folder]
  if (isMembers(path, method)) return [folder]
  const rule = ruleFor(path)
  return rule ? [rule] : []
}

/**
 * The body a refusal is answered with, in the emulator's shape.
 *
 * `dispatchViya` answers a refusal from a handler with this envelope (its
 * `isApiError` arm), and every other answer this mount gives is JSON. A part the
 * upload filter refuses, and content past the cap, are answered before the
 * emulator sees the request, so they are refused here in the same shape rather
 * than in the drive API's plain text: a client parsing these answers sees one
 * form everywhere.
 *
 * `@sasjs/api` exports no builder for that body, so this is a second definition
 * of it. `viyaRouter.spec.ts` compares it with the dispatcher's own answer for a
 * handler's refusal, which is what makes a change to the library's shape fail a
 * test here instead of answering two forms on one mount.
 */
export const emulatedRefusal = (status: number, message: string) => ({
  version: 2,
  httpStatusCode: status,
  errorCode: status,
  message
})

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

/**
 * A file's new content, read here rather than by a global parser.
 *
 * `updateFileContent` in `@sasjs/adapter` puts the new content on the wire as the
 * body, with the file's own content type, so no JSON parser may consume it. The
 * bytes are read at this point in the chain - after `viyaGuard` has authenticated
 * and authorised the caller - because that is what keeps a hundred megabytes from
 * being buffered for someone who turns out to have no grant.
 *
 * `express.raw` refuses past its limit with `entity.too.large`, which is answered
 * here as the mount's own 413 in the estate's envelope: the app's error handler
 * turns everything else into a 500, and 413 is the status this mount gives a body
 * past a ceiling, so the upload route's size refusals answer it too.
 */
const contentOf = async (
  req: express.Request,
  res: express.Response,
  limit: number
): Promise<string | Uint8Array | undefined> => {
  if (!VIYA_CONTENT_PATH.test(req.path)) return undefined
  if (req.method !== 'PUT' && req.method !== 'POST') return undefined

  const raw = express.raw({ type: () => true, limit })

  try {
    await new Promise<void>((resolve, reject) =>
      raw(req, res, (error?: unknown) => (error ? reject(error) : resolve()))
    )
  } catch (error) {
    if ((error as { type?: string })?.type === 'entity.too.large')
      res
        .status(413)
        .json(
          emulatedRefusal(
            413,
            `A file's content must not exceed ${limit} bytes.`
          )
        )
    else throw error

    return undefined
  }

  return req.body instanceof Uint8Array ? req.body : undefined
}

/** A request the emulator should not answer is left to the server's own routes. */
export const isViyaPath = (path: string): boolean =>
  VIYA_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  ) ||
  (localJesEnabled() &&
    (path === '/jobExecution' || path.startsWith('/jobExecution/')))

/**
 * Whether a request is the one the server answers under `/SASLogon`.
 *
 * The predicate lives beside `isViyaPath` because two callers need the same
 * answer: the router, which hands the request to the token port, and the header
 * the mount sets before anything can refuse it.
 */
export const isTokenRequest = (req: express.Request): boolean =>
  req.method === 'POST' && req.path === TOKEN_PATH

/**
 * Mark the answer as an emulated estate.
 *
 * Exported for the host that mounts this router: the guard in front of it can
 * refuse a caller with a 401, and decision 5 asks that refusals say what answered
 * them too. Stamping at the router covers everything that reaches the router;
 * exporting this covers the answer that does not.
 */
export const viyaEmulatedHeaders = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  if (isViyaPath(req.path) || isTokenRequest(req))
    Object.entries(emulatedHeaders()).forEach(([name, value]) =>
      res.setHeader(name, String(value))
    )

  next()
}

/** What the router may be told about the host it is mounted on. */
export interface ViyaRouterOptions {
  /**
   * The largest file content a single request may carry. Stated so a case can
   * measure the refusal without sending a hundred megabytes: the default is the
   * cap production runs with.
   */
  contentBytes?: number
  /**
   * The largest file an upload may carry, stated for the same reason: a case
   * measures the mount's refusal without sending a hundred megabytes.
   */
  uploadBytes?: number
}

export const createViyaRouter = (
  services: (req: express.Request) => Services,
  options: ViyaRouterOptions = {}
) => {
  const contentBytes = options.contentBytes ?? VIYA_CONTENT_BYTES
  const router = express.Router()

  router.use(async (req, res, next) => {
    // the token port is this server's, not the emulator's: the credential in the
    // request is a sasjs/server account, which the emulator has no view of
    const answersToken = isTokenRequest(req)

    // everything else under `/SASLogon` is the web router's - login, authorize,
    // logout - so the emulator never sees a sign-in path. It carries no operation
    // for one, and a client that cannot sign in cannot reach the code grant
    if (!answersToken && !isViyaPath(req.path)) return next()

    // Every answer this mount gives says the estate is emulated - decision 5 of
    // sasjs/server#665, which asks for it on "every response ... including
    // refusals and 404s".
    //
    // Stamped after the test above, so a request this mount passes on is left
    // untouched for whichever router answers it, and before the token branch
    // below, which returns early: that early return is exactly how the token port
    // came to be the one answer without the header. The emulator stamps its own
    // answers too, so most responses carry a header set twice to the same value -
    // cheaper than a promise with an exception in it.
    Object.entries(emulatedHeaders()).forEach(([name, value]) =>
      res.setHeader(name, String(value))
    )

    if (answersToken) return oauthToken(req, res)

    if (isDefinition(req.path) && !hasDefinitionAccess(req))
      return res
        .status(401)
        .json(
          emulatedRefusal(
            401,
            'Viya definition access requires the authorization guard.'
          )
        )

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

        // The drive API answers a refusal as plain text and its clients read it
        // that way; this mount answers the estate's envelope instead. A body past
        // a ceiling is 413 here - the status the content route below answers for
        // the same condition - while the drive keeps its own 400, so the parser
        // states the reason in `code` and the translation happens once, here.
        multerSingle('file', [req, res, () => resolve()], {
          fileSize: options.uploadBytes,
          writeRefusal: (response, { status, message, code }) => {
            const refusalStatus = code === 'LIMIT_FILE_SIZE' ? 413 : status

            response
              .status(refusalStatus)
              .json(emulatedRefusal(refusalStatus, message))
          }
        })
      })

      // a refusal is already answered; nothing below should write a second response
      if (res.headersSent) return
    }

    let answer: ViyaResponse

    try {
      // a file's content, as bytes, read behind the guard: it travels as
      // `contents`, the request-side twin of the response's raw body
      const contents = await contentOf(req, res, contentBytes)

      // a refusal is already answered
      if (res.headersSent) return

      const baseServices = services(req)
      const canReadMetadata = metadataAccess.get(req) === true
      const drive = baseServices.drive
      const restrictedDrive =
        !canReadMetadata && isMembers(req.path, req.method) && drive
          ? {
              ...drive,
              list: async (path?: string) => {
                const listing = await drive.list(path)
                return {
                  ...listing,
                  files: listing.files.filter(
                    (name) => !isReservedDefinition(name)
                  )
                }
              }
            }
          : drive
      const requestServices = isMembers(req.path, req.method)
        ? {
            ...baseServices,
            drive: restrictedDrive,
            viya: {
              ...baseServices.viya,
              readJobDefinitionMetadata: canReadMetadata
            }
          }
        : baseServices
      // Local JES adds members after dispatch. Fetch the whole visible listing
      // first so neither the API nor the registry is paged independently.
      const combinedMembers =
        localJesEnabled() && isMembers(req.path, req.method)
      const query = { ...req.query } as Record<string, string | undefined>
      if (combinedMembers) {
        delete query.start
        delete query.limit
      }
      answer = await dispatchViya(requestServices, req.method, req.path, {
        query,
        body: req.body as Record<string, unknown> | undefined,
        contents,
        file: await uploadOf(req),
        // the caller the guard resolved: the bodies name this account, and the
        // token stays beside it for a request no guard has seen
        subject: subjectOf(req),
        // the scheme is case-insensitive (RFC 7235 2.1), so `bearer <tok>` is a
        // bearer token and not a token that happens to start with the word
        token: req.headers.authorization?.replace(/^Bearer\s+/i, '')
      })
      if (canReadMetadata) await addJesMembers(req, requestServices, answer)
      if (combinedMembers && answer.status === 200) {
        const body = answer.body as {
          items: unknown[]
          start: number
          limit: number
          count: number
        }
        const requestedStart = Number(req.query.start ?? 0)
        const start =
          Number.isSafeInteger(requestedStart) && requestedStart > 0
            ? requestedStart
            : 0
        const limit = Number(req.query.limit ?? 0) || 0
        body.items =
          limit > 0
            ? body.items.slice(start, start + limit)
            : body.items.slice(start)
        body.start = start
        body.limit = limit || body.items.length
        body.count = body.items.length
      }
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
