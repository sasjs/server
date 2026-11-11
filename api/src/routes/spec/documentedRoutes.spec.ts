// MODE has to be in place before the app module loads: `setProcessVariables` only
// installs `process.secrets` in server mode, and the token the probes carry is
// signed with ACCESS_TOKEN_SECRET from it
import '../api/spec/sessionEnv'
import fs from 'fs'
import path from 'path'
import request from 'supertest'
import { Express } from 'express'
import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import appPromise from '../../app'
import { UserController } from '../../controllers'
import { generateAccessToken, saveTokensInDB } from '../../utils'
import { API_ALIAS, API_PREFIX } from '../../utils/routePrefixes'

/**
 * Every operation the document states is mounted in this app.
 *
 * The document is generated from the controller decorators, and the surface is
 * mounted by hand in `src/routes/api/index.ts` - two statements of the same thing
 * with nothing between them. A controller method can be decorated, documented and
 * published in `public/swagger.yaml` while the router never mounts it, and until
 * this ran nothing noticed: the document said the route existed, the API answered
 * `404 Not Found`, and the shared corpus - which is generated from the same
 * document - could not tell the difference either.
 *
 * The probe is the answer every unmounted path already gives: this app ends two
 * ways, and neither is a route. A GET falls through to the catch-all, which answers
 * `404 "Not Found"` as text under a reserved prefix; anything else reaches
 * express's own last handler, which answers an HTML page with `Cannot <METHOD>
 * /path` in it. So a documented operation is mounted when the answer to it is
 * anything else - a controller's own `400` for the empty request this sends counts,
 * and so does the `200` an authenticated read gives.
 *
 * The probes carry an administrator's token, which is the difference between asking
 * whether a router is mounted and whether an operation is still in it. Unauthenticated,
 * every route behind `authenticateAccessToken` answers `401` whether or not the
 * operation behind it still exists. With the token the middleware passes, the
 * request reaches the router, and an operation that has been deleted or renamed
 * matches nothing and falls through to the same 404 as an unmounted path.
 *
 * The token is minted per probe, because one of the operations being probed
 * revokes credentials: `POST /auth/logout` clears the caller's tokens from the user
 * record, and every probe after it would answer `401` - which counts as mounted, and
 * would hide a missing operation for the rest of the run.
 *
 * The request is the operation's own method and asks for JSON, which is what makes
 * the answers decidable: the catch-all serves the interface's shell to a request
 * that accepts HTML, and answers `404 "Not Found"` to one that does not. A mounted
 * route that serves the shell on purpose - `GET /` is the interface - would
 * otherwise be indistinguishable from a path nothing mounts.
 *
 * The operations under the API mount are asked for under BOTH spellings it answers
 * to - `/SASjsApi` and the short `/api` - because the document states only the
 * canonical one, and an alias that stopped being mounted would be a route the
 * interface links to and the API no longer answers. The paths outside that mount
 * (`/` and the `/SASLogon` endpoints) are mounted at the root and have one
 * spelling, so they are asked for once.
 */
const apiRoot = path.resolve(__dirname, '../../..')
const specPath = path.join(apiRoot, 'public', 'swagger.yaml')

const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'patch']

/**
 * The two spellings every operation under the API mount has to answer on.
 *
 * Stated here rather than read from `API_PREFIXES`, which is the mount's own list:
 * a check that asked for whatever the mount declares would agree with a mount that
 * had quietly dropped `/api`, which is the spelling the interface links to and the
 * adapter addresses.
 */
const PREFIXES = [API_PREFIX, API_ALIAS]

/**
 * What an unmounted path answers, and nothing else does.
 *
 * Two shapes, because the app ends two ways: a GET falls through to the catch-all
 * that answers `404 "Not Found"` as text under a reserved prefix, and anything else
 * reaches express's own last handler, which answers an HTML page whose message is
 * `Cannot <METHOD> /path` - inside markup, so the match cannot be anchored.
 */
const notMounted = (
  method: string,
  answer: { status: number; text: string }
): boolean =>
  answer.status === 404 &&
  (answer.text === 'Not Found' || answer.text.includes(`Cannot ${method} /`))

interface Operation {
  method: string
  path: string
}

/**
 * The paths and methods the document states, read from the file itself.
 *
 * Not YAML: the `paths` section is a route per line at the first indent and a
 * method per line at the second, and adding a YAML parser (and its types) to the
 * package to read two levels of it would be a bigger thing than the check. Reading
 * the server's own copy is the point - the package carries a vendored copy, and a
 * stale one there must not be mistaken for this document.
 */
const documentedOperations = (): Operation[] => {
  const operations: Operation[] = []
  let route: string | undefined
  let inPaths = false

  for (const line of fs.readFileSync(specPath, 'utf8').split('\n')) {
    if (line.startsWith('paths:')) {
      inPaths = true
      continue
    }
    if (!inPaths) continue
    // a new top-level key ends the section
    if (/^\S/.test(line)) break

    // a path that carries a parameter is quoted by the generator, and one that
    // does not is bare: reading only the bare form would attribute the quoted
    // paths' methods to the path above them and never probe them at all
    const routeMatch = /^ {4}'?(\/[^']*)'?:\s*$/.exec(line)
    if (routeMatch) {
      route = routeMatch[1]
      continue
    }

    const methodMatch = /^ {8}([a-z]+):\s*$/.exec(line)
    if (route && methodMatch && HTTP_METHODS.includes(methodMatch[1]))
      operations.push({ method: methodMatch[1].toUpperCase(), path: route })
  }

  return operations
}

/** A path parameter as a caller would fill it: one segment, nothing exotic. */
const filled = (route: string): string => route.replace(/\{([^}]+)\}/g, 'probe')

describe('the documented operations', () => {
  let app: Express
  let operations: Operation[]
  let con: Mongoose
  let mongoServer: MongoMemoryServer
  let probeUserId: string

  const clientId = 'someclientID'

  beforeAll(async () => {
    app = await appPromise
    operations = documentedOperations()

    // The suite runs in `MODE=server` (the unit-test job sets it, and warms mongod
    // for exactly this reason), where the middleware in front of a mounted router
    // looks the caller up: with no connection mongoose buffers for ten seconds per
    // lookup, so the probes take ten minutes and the test times out.
    mongoServer = await MongoMemoryServer.create()
    con = await mongoose.connect(mongoServer.getUri())

    // The probes are authenticated, and that is what makes the check about the
    // operations rather than the mounts. Unauthenticated, every route behind
    // `authenticateAccessToken` answers `401` - mounted or not - so an operation
    // deleted from a router that is still mounted would go unnoticed. With a token
    // the middleware passes, the request reaches the router, and a deleted operation
    // matches nothing and falls through to the catch-all's 404 like any other path.
    // An administrator, because the middleware in front of several mounts answers
    // `401` to anyone else and would hide the router behind it again. The token is
    // written to the user as well as signed: the middleware checks it against the
    // record, so a token that was only signed is refused.
    const users = new UserController()

    const probe = await users.createUser({
      displayName: 'Documentation Probe',
      username: 'documentationProbe',
      password: 'documentationProbePassword',
      isAdmin: true,
      isActive: true
    } as any)

    probeUserId = probe.uid
  })

  afterAll(async () => {
    await con.connection.close()
    await mongoServer.stop()
  })

  /**
   * A token for one probe, signed and written to the user.
   *
   * One per request rather than one for the run, because some of the operations
   * being probed revoke credentials: `POST /auth/logout` removes the caller's
   * tokens from the user record, and every probe after it would then answer `401`
   * - which counts as mounted and would hide a missing operation. Minting against
   * the same user keeps each probe independent of what the last one did.
   */
  const bearer = async (): Promise<string> => {
    const fresh = await generateAccessToken({
      clientId,
      userId: probeUserId
    })

    await saveTokensInDB(probeUserId, clientId, fresh, 'aRefreshToken')

    return fresh
  }

  /**
   * One probe, with the answer drained.
   *
   * Reading the body to the end is what closes the connection: a handler that
   * streams - a log tail, a session's output - leaves it open otherwise, and jest
   * waits for it long after the assertions have passed.
   */
  const ask = async (
    method: string,
    route: string,
    accept = 'application/json'
  ): Promise<{ status: number; text: string; contentType: string }> => {
    let status = 0
    let text = ''
    let contentType = ''

    await (request(app) as any)
      [method.toLowerCase()](route)
      .set('Accept', accept)
      .set('Authorization', `Bearer ${await bearer()}`)
      .buffer(true)
      .parse((res: any, done: any) => {
        status = res.statusCode
        contentType = res.headers['content-type'] || ''
        res.setEncoding('utf8')
        res.on('data', (chunk: string) => (text += chunk))
        res.on('end', () => done(null, {}))
      })

    return { status, text, contentType }
  }

  it('are all in this app, not only in the document', async () => {
    // a parser that read nothing would pass an empty list of misses, and one that
    // read a path twice would probe the wrong path twice: both are catches of the
    // same kind, and the document's own count is the check
    expect(operations.length).toBeGreaterThan(50)
    expect(new Set(operations.map((o) => `${o.method} ${o.path}`)).size).toBe(
      operations.length
    )

    // The whole check rests on the probes being authenticated, and a token that is
    // not accepted does not fail loudly: it answers `401`, which counts as mounted,
    // so the check would quietly fall back to asking whether the routers are mounted
    // - green, and blind to a deleted operation. So ask one protected route first,
    // and require the token to be honoured before trusting anything below.
    //
    // `GET /admin/diagnostics` - behind the token and an admin check, and a read,
    // so it cannot be answered by the public-grant fallback `/info` gets or cost
    // anything to ask. A blanket "no probe may answer 401" would not do:
    // `POST /auth/refresh` legitimately does, and it is in the document too.
    const canary = await ask('GET', `${API_PREFIX}/admin/diagnostics`)

    expect(canary).not.toMatchObject({ status: 401, text: 'Unauthorized' })

    const unmounted: string[] = []
    const probed = new Set<string>()

    for (const operation of operations) {
      // one spelling for a path the API mount does not own: prefixing it would ask
      // the same URL twice and assert nothing the second time
      const prefixes = operation.path.startsWith(API_PREFIX) ? PREFIXES : [null]

      for (const prefix of prefixes) {
        const path =
          prefix === null
            ? filled(operation.path)
            : filled(operation.path).replace(API_PREFIX, prefix)

        // the same URL twice is a probe that asserts nothing: a path the alias
        // cannot prefix has already been asked for
        expect(probed.has(`${operation.method} ${path}`)).toBe(false)
        probed.add(`${operation.method} ${path}`)

        const response = await ask(operation.method, path)

        // a documented path that nothing mounts is answered by the last handler,
        // not by a route: that is the difference this checks
        if (notMounted(operation.method, response))
          unmounted.push(`${operation.method} ${path}`)
      }
    }

    expect(unmounted).toEqual([])
  }, 120000)

  it('recognises the answers an unmounted path gives, and only those', async () => {
    // the arms above, against the shapes the app really emits: the catch-all's
    // plain text and express's own page. A control here, because an arm that
    // silently stopped matching would leave the check green and blind
    expect(notMounted('GET', { status: 404, text: 'Not Found' })).toBe(true)

    expect(
      notMounted('POST', {
        status: 404,
        text: '<!DOCTYPE html>\n<html lang="en">\n<body>\n<pre>Cannot POST /SASjsApi/nope/nothing</pre>\n</body>'
      })
    ).toBe(true)

    // a mounted path's answer is neither of them
    expect(
      notMounted('POST', {
        status: 400,
        text: '{\"status\":\"failure\",\"message\":\"\\\"id\\\" is required\"}'
      })
    ).toBe(false)

    // and the probe asks for JSON for this reason: an unmatched root-level path is a
    // `404 Not Found` to a caller that does not accept HTML, while a caller that does
    // is served the interface's shell - which is also what a mounted `GET /` answers,
    // so the shell could never tell a route from a path nothing mounts
    const asJson = await ask('GET', '/not-a-route-of-this-app')

    expect(asJson.status).toBe(404)
    expect(notMounted('GET', asJson)).toBe(true)
  })
})
