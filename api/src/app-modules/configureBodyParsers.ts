import express, { Express } from 'express'
import { DEPLOY_PAYLOAD_BYTES } from '@sasjs/api'

import { API_PREFIXES } from '../utils'

/**
 * The one route that takes a request body as CONTENT rather than as JSON.
 *
 * `updateFileContent` in `@sasjs/adapter` puts a file PUT on the wire with the
 * file's own content type - `text/plain` for a program, `application/json` for a
 * `.json` file - and the file's bytes as the body. No JSON parser may consume it:
 * the second of those types would arrive as an object, or be refused when the file
 * is not itself valid JSON.
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
 * A file's content (`VIYA_CONTENT_PATH`) is the exception, and it is deliberately
 * the one path no parser here touches: the Viya router reads those bytes itself,
 * behind its guard, so a hundred megabytes is never buffered for a caller who has
 * not been authenticated and authorised yet.
 *
 * There is no urlencoded parser here. The only consumers of a form-encoded body
 * mount their own: the Viya token port (`routes/viya/token.ts`) and the SAS9
 * mock's login form (`routes/web/sas9-web.ts`). A global one would be
 * body-parsing surface with no production need.
 */
export const configureBodyParsers = (app: Express) => {
  API_PREFIXES.forEach((prefix) =>
    app.use(
      `${prefix}/drive/deploy`,
      express.json({ limit: DEPLOY_PAYLOAD_BYTES })
    )
  )

  app.use(
    express.json({
      limit: '100mb',
      // A function here is `shouldParse` itself, so it must answer in booleans:
      // returning the type NAME is truthy and makes the parser read every body,
      // multipart included. The path decides first, then the type it always
      // matched.
      type: (req: {
        url?: string
        headers?: Record<string, string | string[] | undefined>
      }) => {
        if (VIYA_CONTENT_PATH.test((req.url ?? '').split('?')[0])) return false

        const contentType = String(req.headers?.['content-type'] ?? '')

        return /^application\/json\b/i.test(contentType)
      }
    })
  )

  // Express 5 leaves req.body undefined when the request carries no parsable
  // body (express 4 defaulted it to {}). Every route handler validates req.body
  // with joi and assumes an object, and joi 18's validate(undefined) succeeds
  // silently, so restore the express 4 default here.
  app.use((req, _res, next) => {
    if (req.body === undefined) req.body = {}
    next()
  })
}
