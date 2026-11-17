import express, { Express } from 'express'
import { DEPLOY_PAYLOAD_BYTES } from '@sasjs/api'

import { API_PREFIXES } from '../utils'

/**
 * How a request body is read, in one place.
 *
 * It is a module rather than a block in `app.ts` because more than one entry
 * point mounts the routes: the server itself, and a test harness that mounts
 * `setupRoutes` on a bare express app. A harness without these parsers answers
 * `A folder name is required.` to a request that carries a name, which reads as
 * a handler defect and sends the reader to the wrong file.
 *
 * The deploy cap is stated in DECODED bytes and its tree travels as JSON, in
 * which file contents are base64 - 4/3 of what they write - so a tree at the
 * cap is up to ~134MB on the wire. That parser is mounted for the deploy routes
 * ONLY: everything else keeps the global limit below, because a request body is
 * buffered before authentication and no other route needs the headroom. Matching
 * on the folder also covers /drive/deploy/upload, whose body is multipart and
 * which express.json therefore ignores.
 *
 * Mounted on every spelling of the API prefix: the alias buffers the same body,
 * so a deploy that succeeds on /SASjsApi/drive/deploy must not be refused with
 * entity.too.large on /api/drive/deploy.
 *
 * There is no urlencoded parser here. The only consumers of a form-encoded body
 * mount their own: the Viya token port (`routes/viya/token.ts`) and the SAS9
 * mock's login form (`routes/web/sas9-web.ts`). A global one would be
 * body-parsing surface with no production need.
 */
/**
 * The one route that takes a request body as CONTENT rather than as JSON.
 *
 * `updateFileContent` in `@sasjs/adapter` puts a file PUT on the wire with the
 * file's own content type - `text/plain` for a program, `application/json` for a
 * `.json` file - and the file's bytes as the body. A JSON parser consumes the
 * second of those and hands on an object, so the bytes have to be taken before it
 * runs, for every content type rather than the text ones only.
 */
export const VIYA_CONTENT_PATH = /^\/files\/files\/[^/]+\/content$/

/**
 * The largest file content a single request may carry.
 *
 * This is the mount's own rule rather than a copy of the JSON parser's: it matches
 * the global `100mb` below, not the larger deploy-only limit, because a file's
 * content is not a deploy payload.
 */
export const VIYA_CONTENT_BYTES = 100 * 1024 * 1024

/** What the parsers may be told about the host they serve. */
export interface BodyParserOptions {
  /**
   * The largest file content a single request may carry. Stated so a case can
   * measure the refusal without sending a hundred megabytes: the default is the
   * cap production runs with.
   */
  contentBytes?: number
}

export const configureBodyParsers = (
  app: Express,
  options: BodyParserOptions = {}
) => {
  const contentBytes = options.contentBytes ?? VIYA_CONTENT_BYTES

  // Before every JSON parser, and for every content type: the bytes have to
  // survive whatever the file's type is
  app.use(
    VIYA_CONTENT_PATH,
    express.raw({ type: () => true, limit: contentBytes })
  )

  // The size refusal, in the shape the rest of the Viya mount answers in. A
  // body-parser error carries `type` and a 413 status, and the app's own error
  // handler turns everything into a 500, so it is answered here.
  app.use(
    VIYA_CONTENT_PATH,
    (
      error: { type?: string },
      _req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      if (error?.type === 'entity.too.large')
        return res.status(413).json({
          message: `A file's content must not exceed ${contentBytes} bytes.`
        })

      next(error)
    }
  )

  API_PREFIXES.forEach((prefix) =>
    app.use(
      `${prefix}/drive/deploy`,
      express.json({ limit: DEPLOY_PAYLOAD_BYTES })
    )
  )

  app.use(express.json({ limit: '100mb' }))

  // Express 5 leaves req.body undefined when the request carries no parsable
  // body (express 4 defaulted it to {}). Every route handler validates req.body
  // with joi and assumes an object, and joi 18's validate(undefined) succeeds
  // silently, so restore the express 4 default here.
  app.use((req, _res, next) => {
    if (req.body === undefined) req.body = {}
    next()
  })
}
