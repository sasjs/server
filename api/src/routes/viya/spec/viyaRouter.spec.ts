import express from 'express'
import { mkdtemp, readdir } from 'fs/promises'
import http from 'http'
import { tmpdir } from 'os'
import { join } from 'path'
import request from 'supertest'

import {
  createViyaRouter,
  emulatedRefusal,
  isViyaPath,
  ruleFor,
  viyaGuard,
  type ViyaRouterOptions
} from '../index'
import { configureBodyParsers } from '../../../app-modules'
import { subjectOf } from '../services'
import { createDriveService, dispatchViya } from '@sasjs/api'
import { MemoryDriveStore } from '@sasjs/api'
import type { Services } from '@sasjs/api'

/**
 * The mount, and the boundary around it.
 *
 * These cases do not boot the server: the emulator's behaviour is `@sasjs/api`'s
 * and is tested there. What is this server's is the wiring - which paths the
 * router answers, what it leaves to the server's own routes, and whether the
 * caller's account and this server's engine reach the emulator at all.
 */
const withExecution = (webout: string, log: string): Services => ({
  drive: undefined as never,
  identity: undefined as never,
  viya: {
    serverUrl: 'http://localhost:5000',
    execute: async () => ({ webout, log })
  }
})

/**
 * The fileref, once the run behind the 201 has landed.
 *
 * A wall-clock sleep is a race with whatever else the runner is doing, so the
 * wait is a bounded poll on the answer itself.
 */
const pollWebout = async (mount: express.Express, sessionId: string) => {
  let last: request.Response | undefined

  for (let attempt = 0; attempt < 100; attempt++) {
    last = await request(mount).get(
      `/compute/sessions/${sessionId}/filerefs/_webout/content`
    )

    if (last.status === 200) return last

    await new Promise((resolve) => setTimeout(resolve, 5))
  }

  return last as request.Response
}

const app = (
  services: (req: express.Request) => Services,
  options?: ViyaRouterOptions
) => {
  const server = express()

  // the server's own parsers, from the server's own module: a fixture that mounts
  // its own would answer a file PUT differently from production
  configureBodyParsers(server)
  server.use('/', createViyaRouter(services, options))
  // what the server's own routes would answer for anything the router declines
  server.use('/', (_req, res) => res.status(418).json({ message: 'not viya' }))

  return server
}

/**
 * A POST whose multipart body is written in chunks, so no Content-Length reaches
 * the parser - the arm the filter cannot see. Supertest buffers what it is given
 * and computes that header, so this goes through a real listener.
 */
const chunked = async (
  server: express.Express,
  boundary: string,
  body: Buffer
): Promise<{ status: number; body: Record<string, unknown> }> => {
  const listener = await new Promise<import('http').Server>((resolve) => {
    const started = server.listen(0, () => resolve(started))
  })
  const { port } = listener.address() as { port: number }

  try {
    return await new Promise<{ status: number; body: Record<string, unknown> }>(
      (resolve, reject) => {
        const req = http.request(
          {
            port,
            path: '/files/files',
            method: 'POST',
            headers: {
              'Content-Type': `multipart/form-data; boundary=${boundary}`,
              'Transfer-Encoding': 'chunked'
            }
          },
          (res) => {
            const chunks: Buffer[] = []

            res.on('data', (chunk) => chunks.push(chunk as Buffer))
            res.on('end', () =>
              resolve({
                status: res.statusCode as number,
                body: JSON.parse(Buffer.concat(chunks).toString())
              })
            )
          }
        )

        req.on('error', reject)
        req.write(body.subarray(0, 40))
        req.write(body.subarray(40))
        req.end()
      }
    )
  } finally {
    await new Promise<void>((resolve) => listener.close(() => resolve()))
  }
}

describe('the caller the guard resolved', () => {
  const withDrive = (): Services => ({
    drive: createDriveService(new MemoryDriveStore()),
    viya: { serverUrl: 'http://localhost:5000' }
  })

  /** What `authenticateAccessToken` leaves on the request, and nothing else. */
  const asUser =
    (username: string): express.RequestHandler =>
    (req, _res, next) => {
      req.user = {
        userId: 'u1',
        clientId: 'c1',
        username,
        displayName: username,
        isAdmin: false,
        isActive: true,
        needsToUpdatePassword: false
      }

      next()
    }

  const mountFor = (username: string): express.Express => {
    const server = express()

    configureBodyParsers(server)
    server.use(asUser(username))
    server.use(
      '/',
      createViyaRouter(() => withDrive())
    )

    return server
  }

  it('stamps the bodies with the account the guard resolved', async () => {
    const answer = await request(mountFor('alice'))
      .post('/folders/folders')
      .query({ parentFolderUri: '' })
      .send({ name: 'alice-folder' })

    expect(answer.status).toBe(201)
    expect(answer.body).toMatchObject({
      createdBy: 'alice',
      modifiedBy: 'alice'
    })
  })

  /**
   * The identity route and the bodies are the same answer, so the mount's subject
   * has to reach both: a regression that stopped passing it would leave the
   * conformance run's `me.id` truthy on the emulated fallback and nothing else
   * would notice.
   */
  it('answers the same account at /@currentUser', async () => {
    const answer = await request(mountFor('alice')).get(
      '/identities/users/@currentUser'
    )

    expect(answer.status).toBe(200)
    expect(answer.body).toMatchObject({ id: 'alice', name: 'alice' })
  })

  it('passes the authenticated account ID separately from the wire identity', async () => {
    const server = express()
    server.get('/', asUser('alice'), (req, res) => {
      res.json(subjectOf(req))
    })

    const answer = await request(server).get('/')

    expect(answer.body).toEqual({
      userId: 'alice',
      clientId: 'c1',
      ownerId: 'u1'
    })
  })

  it('names the emulated user when no guard resolved one', async () => {
    const answer = await request(app(() => withDrive()))
      .post('/folders/folders')
      .query({ parentFolderUri: '' })
      .send({ name: 'anonymous-folder' })

    expect(answer.status).toBe(201)
    expect(answer.body).toMatchObject({ createdBy: 'emulated-user' })
  })
})

describe('the Viya mount', () => {
  it('answers the paths a Viya client uses, with the emulated header', async () => {
    const answer = await request(app(() => withExecution('[]', ''))).get(
      '/compute/contexts'
    )

    expect(answer.status).toBe(200)
    expect(answer.headers['x-sasjs-emulated']).toMatch(/^viya@/)
    expect(answer.body.items[0].name).toBeTruthy()
  })

  // The other side of the same rule: a request this mount passes on must not be
  // marked, or every answer the server gives in emulated mode would claim to come
  // from an emulated estate
  it('leaves a path it does not answer unmarked', async () => {
    const answer = await request(app(() => withExecution('[]', ''))).get(
      '/SASjsApi/info'
    )

    expect(answer.status).toBe(418)
    expect(answer.headers['x-sasjs-emulated']).toBeUndefined()
  })

  it('leaves everything else to the server own routes', async () => {
    const answer = await request(app(() => withExecution('[]', ''))).get(
      '/SASjsApi/info'
    )

    expect(answer.status).toBe(418)
  })

  it('knows a prefix from a path that merely starts with it', () => {
    expect(isViyaPath('/compute/contexts')).toBe(true)
    expect(isViyaPath('/compute')).toBe(true)
    // `/computer` is not `/compute`
    expect(isViyaPath('/computer')).toBe(false)
  })

  it('runs a submitted service on the engine and serves its webout', async () => {
    const services: Services = withExecution('[{"COL1":"real"}]', 'NOTE: ran')
    const mount = app(() => services)

    const session = await request(mount)
      .post('/compute/contexts/emulated/sessions')
      .send({})

    expect(session.status).toBe(404)

    const sessionFromList = await request(mount).get('/compute/contexts')
    const contextId = sessionFromList.body.items[0].id

    const created = await request(mount)
      .post(`/compute/contexts/${contextId}/sessions`)
      .send({})

    expect(created.status).toBe(201)

    const sessionId = created.body.id as string

    const submitted = await request(mount)
      .post(`/compute/sessions/${sessionId}/jobs`)
      .send({ code: ['%put hi;'], name: '/app/services/getdata' })

    expect(submitted.status).toBe(201)

    const webout = await pollWebout(mount, sessionId)

    expect(webout.status).toBe(200)
    expect(webout.text).toBe('[{"COL1":"real"}]')
  })

  it('serves a webout as raw bytes, not as a quoted JSON string', async () => {
    const services = withExecution('line one\nline two', '')
    const mount = app(() => services)

    const contexts = await request(mount).get('/compute/contexts')
    const created = await request(mount)
      .post(`/compute/contexts/${contexts.body.items[0].id}/sessions`)
      .send({})

    await request(mount)
      .post(`/compute/sessions/${created.body.id}/jobs`)
      .send({ code: ['data a; run;'] })

    const answer = await pollWebout(mount, created.body.id)

    // a host that mapped `body` would answer "\"line one\\nline two\""
    expect(answer.text).toBe('line one\nline two')
  })
})

const requestRules: string[] = []

const guardApp = (authenticate: express.RequestHandler) => {
  const server = express()

  server.use(express.json())
  server.use(
    '/',
    viyaGuard(authenticate, (req, _res, next) => {
      requestRules.push(req.url)
      next()
    }),
    createViyaRouter(() => withExecution('[]', ''))
  )
  server.use('/', (_req, res) => res.status(200).send('the app shell'))

  return server
}

const refuses = (_req: express.Request, res: express.Response) =>
  res.status(401).json({ message: 'no token' })

describe('who may reach the estate', () => {
  it('guards a path that runs caller code', async () => {
    const answer = await request(guardApp(refuses)).post(
      '/compute/contexts/x/sessions'
    )

    expect(answer.status).toBe(401)
  })

  it.each(['route', 'router'])(
    'treats authentication callback value %s as a failure, not Express control flow',
    (error) => {
      const authenticate: express.RequestHandler = (_req, _res, next) =>
        next(error)
      const decide = jest.fn()
      const next = jest.fn()
      const path = '/identities/users/@currentUser'

      viyaGuard(authenticate, decide)(
        { path, url: path, baseUrl: '' } as express.Request,
        {} as express.Response,
        next
      )

      expect(next.mock.calls).toEqual([[expect.any(Error)]])
      expect(decide).not.toHaveBeenCalled()
    }
  )

  it('denies a failed credential lookup before the mounted router runs', async () => {
    const error = new Error('identity lookup failed')
    const authenticate: express.RequestHandler = async (_req, _res, next) =>
      next(error)
    const decide = jest.fn((_req, _res, next: express.NextFunction) => next())
    const services = jest.fn(() => withExecution('[]', ''))
    const handleError = jest.fn()
    const onError: express.ErrorRequestHandler = (err, _req, res, _next) => {
      handleError(err)
      res.sendStatus(500)
    }
    const server = express()
    server.use(viyaGuard(authenticate, decide), createViyaRouter(services))
    server.use(onError)

    await request(server).get('/compute/contexts').expect(500)
    expect(handleError).toHaveBeenCalledWith(error)
    expect(decide).not.toHaveBeenCalled()
    expect(services).not.toHaveBeenCalled()
  })

  it('treats a non-Error rejection from authentication as a failure', async () => {
    const authenticate: express.RequestHandler = async () =>
      Promise.reject('route')
    const decide = jest.fn()
    const next = jest.fn()
    const path = '/compute/contexts'

    await viyaGuard(authenticate, decide)(
      { path, url: path, baseUrl: '' } as express.Request,
      {} as express.Response,
      next
    )

    expect(next.mock.calls).toEqual([[expect.any(Error)]])
    expect(decide).not.toHaveBeenCalled()
  })

  it.each(['throw', 'reject', 'reject without an Error'])(
    'forwards a permission %s after restoring the mounted request',
    async (failure) => {
      const error = new Error('permission lookup failed')
      const path = '/compute/contexts'
      const url = `${path}?limit=1`
      const baseUrl = '/mount'
      const req = { path, url, baseUrl } as express.Request
      let continuation: Promise<unknown> | undefined
      const authenticate: express.RequestHandler = (_req, _res, next) => {
        // Observe settlement for the test, but do not return it to the guard.
        continuation = Promise.resolve(next()).catch(() => undefined)
      }
      const decide: express.RequestHandler = (request) => {
        expect(request.url).toBe('/SASjsApi/code/execute')
        expect(request.baseUrl).toBe('')
        if (failure === 'throw') throw error
        return Promise.reject(failure === 'reject' ? error : undefined)
      }
      const forwarded = jest.fn()
      const next: express.NextFunction = (error?: unknown) => {
        forwarded(error, req.url, req.baseUrl)
      }

      await viyaGuard(authenticate, decide)(req, {} as express.Response, next)
      await continuation

      expect(forwarded).toHaveBeenCalledTimes(1)
      const [[forwardedError, forwardedUrl, forwardedBaseUrl]] =
        forwarded.mock.calls
      if (failure === 'reject without an Error') {
        expect(forwardedError).toEqual(
          new Error('Viya permission check failed')
        )
      } else {
        expect(forwardedError).toBe(error)
      }
      expect(forwardedUrl).toBe(url)
      expect(forwardedBaseUrl).toBe(baseUrl)
    }
  )

  it('continues without a permission lookup after authenticating an unmapped path', async () => {
    const authenticate = jest.fn((_req, _res, next: express.NextFunction) => {
      next()
    })
    const decide = jest.fn()
    const next = jest.fn()
    const path = '/identities/users/@currentUser'
    const req = { path, url: path, baseUrl: '/mount' } as express.Request

    await viyaGuard(authenticate, decide)(req, {} as express.Response, next)

    expect(authenticate).toHaveBeenCalledTimes(1)
    expect(decide).not.toHaveBeenCalled()
    expect(next.mock.calls).toEqual([[]])
    expect(req).toMatchObject({ url: path, baseUrl: '/mount' })
  })

  it('leaves the application shell to the web router, unauthenticated', async () => {
    // the guard used to sit at the root, which turned `GET /` into a 401 and
    // left a caller no way to reach the login page
    const answer = await request(guardApp(refuses)).get('/')

    expect(answer.status).toBe(200)
    expect(answer.text).toBe('the app shell')
  })

  it('leaves the estate sign-in paths to the web router', async () => {
    // the emulator carries one /SASLogon operation, and this server answers it
    // itself. A prefix match on /SASLogon would swallow login and authorize and
    // answer `404 No operation is emulated`, so the code grant could never be fed
    const answer = await request(app(() => withExecution('[]', '')))
      .post('/SASLogon/login')
      .send({})

    expect(answer.status).toBe(418)
  })

  it('leaves the token port open, because the credentials are the request', async () => {
    // a caller with no token is exactly who the token endpoint is for: guarding
    // it would refuse the request that asks for the first one. The answer is the
    // OAuth shape, from the server rather than from the guard
    const answer = await request(guardApp(refuses)).post(
      '/SASLogon/oauth/token'
    )

    expect(answer.status).toBe(401)
    expect(answer.body.error).toBe('invalid_client')
  })
})

describe('the rule a Viya path is decided on', () => {
  it('maps the estate paths onto the API rules that carry the same capability', () => {
    // a job submission runs arbitrary code; a file route reads or writes the
    // drive. The Viya paths are in no rule's inventory, so deciding on them
    // would pass every caller
    expect(ruleFor('/compute/sessions/x/jobs')).toBe('/SASjsApi/code/execute')
    expect(ruleFor('/files/files/abc/content')).toBe('/SASjsApi/drive/file')
    expect(ruleFor('/folders/folders/abc')).toBe('/SASjsApi/drive/folder')
    expect(ruleFor('/identities/users/@currentUser')).toBeUndefined()
  })

  it('hands the mapped rule to the permission gate, not the Viya path', async () => {
    requestRules.length = 0

    // a caller the guard admits, so the decision itself is what runs
    await request(guardApp((_req, _res, next) => next())).post(
      '/compute/sessions/x/jobs'
    )

    expect(requestRules).toContain('/SASjsApi/code/execute')
  })
})

describe('an upload over the Viya paths', () => {
  beforeAll(async () => {
    // the app sets these at boot; a router spec has to stand in for that, or the
    // multer helper has nowhere to put the part
    const root = await mkdtemp(join(tmpdir(), 'viya-upload-'))

    process.sasjsRoot = root
    process.driveLoc = join(root, 'drive')
  })

  it('reaches the emulator as a file, and leaves no part behind', async () => {
    const saved: string[] = []
    const contents = 'data a; run;'

    const mount = app(() => {
      const services = withExecution('[]', '')

      services.drive = {
        tree: async () => ({
          status: 'success',
          tree: { name: '', relativePath: '/', isFolder: true, children: [] }
        }),
        save: async (path: string) => {
          saved.push(path)

          return { status: 'success' } as never
        },
        read: async () => ({ contents, binary: false })
      } as never

      return services
    })

    const answer = await request(mount)
      .post('/files/files')
      .attach('file', Buffer.from(contents), 'program.sas')

    expect(answer.status).toBe(201)
    expect(saved).toEqual(['/program.sas'])

    // the parser writes the part under uploads; the emulator already has the
    // bytes, so the copy is removed rather than accumulating one per upload
    const left = await readdir(
      join(process.sasjsRoot as string, 'uploads')
    ).catch(() => [] as string[])

    expect(left).toEqual([])
  })

  /**
   * A part the upload filter refuses - an extension the drive blocks - is
   * answered before the emulator sees the request. Every other answer this mount
   * gives is JSON, so the refusal travels in the same envelope a handler's
   * refusal does; the parser's plain-text body was the one bare string a client
   * parsing these answers could meet.
   */
  it("answers the parser's refusal in the emulator's envelope", async () => {
    const mount = app(() => withExecution('[]', ''))

    const answer = await request(mount)
      .post('/files/files')
      .attach('file', Buffer.from('MZ'), 'program.exe')

    // the drive's refusal, in the shape `dispatchViya` answers one with
    expect(answer.status).toBe(400)
    expect(answer.headers['content-type']).toMatch(/json/)
    expect(answer.body).toEqual({
      version: 2,
      httpStatusCode: 400,
      errorCode: 400,
      message: 'Invalid file extension'
    })
    // a refusal is still the emulator's answer, and decision 5 stamps those too
    expect(answer.headers['x-sasjs-emulated']).toMatch(/^viya@/)
  })

  /**
   * A part past the mount's own ceiling is 413, matching the content route's cap,
   * whether the filter refuses it from Content-Length or multer's limit catches
   * it. `uploadBytes` is stated for this case: production runs at the parser's
   * default and no test can send a hundred megabytes.
   */
  it('answers an over-cap upload as 413 in the envelope', async () => {
    const mount = app(() => withExecution('[]', ''), { uploadBytes: 8 })

    const answer = await request(mount)
      .post('/files/files')
      .attach('file', Buffer.alloc(9, 'x'), 'a.txt')

    expect(answer.status).toBe(413)
    expect(answer.body).toMatchObject({
      version: 2,
      httpStatusCode: 413,
      errorCode: 413
    })
    expect(answer.body.message).toMatch(/^File size is over limit/)
  })

  /**
   * The other arm of the same ceiling: a part streamed without a Content-Length
   * never reaches the filter, so multer's own limit refuses it and the parser
   * passes `LIMIT_FILE_SIZE` to the writer. This is the path the mount's
   * translation exists for, and nothing else on the mount exercises it.
   */
  it('answers a chunked over-cap upload the same way', async () => {
    const mount = app(() => withExecution('[]', ''), { uploadBytes: 8 })

    const boundary = 'viya-part-boundary'
    const body = Buffer.concat([
      Buffer.from(
        `--${boundary}\r\n` +
          'Content-Disposition: form-data; name="file"; filename="a.txt"\r\n' +
          'Content-Type: text/plain\r\n\r\n'
      ),
      Buffer.alloc(9, 'x'),
      Buffer.from(`\r\n--${boundary}--\r\n`)
    ])

    const answer = await chunked(mount, boundary, body)

    expect(answer.status).toBe(413)
    expect(answer.body).toMatchObject({
      version: 2,
      httpStatusCode: 413,
      errorCode: 413
    })
    // multer's own message, which is how the case knows the other arm ran
    expect(answer.body.message).toBe('File too large')
  })

  /**
   * The envelope is not this server's invention: `dispatchViya` renders the same
   * keys for a handler's `ApiError`, and `@sasjs/api` exports no builder for the
   * body. The parser's refusal is built here, so this case is what holds the two
   * in step - a bump that changes the emulator's shape fails here, rather than
   * answering two forms on one mount.
   */
  it("renders the same refusal envelope @sasjs/api's dispatcher does", async () => {
    // a handler's own refusal: an unknown session is an ApiError(404)
    const refused = await dispatchViya(
      withExecution('[]', ''),
      'GET',
      '/compute/sessions/no-such-session/state',
      { query: {} }
    )

    expect(refused.status).toBe(404)

    const body = refused.body as { message: string }

    expect(emulatedRefusal(refused.status, body.message)).toEqual(refused.body)
  })

  /**
   * `updateFileContent` in `@sasjs/adapter` puts the new content on the wire as
   * the body itself, with the file's own content type, and `express.json` leaves
   * that body unread - so the mount has to hand the emulator the bytes. Without
   * it the caller is answered `400 File content is required.` having just sent the
   * content.
   */
  it("hands a file PUT's content to the emulator as bytes", async () => {
    const updates: Array<string | Uint8Array> = []

    const mount = app(() => {
      const services = withExecution('[]', '')

      services.drive = {
        tree: async () => ({
          status: 'success',
          tree: {
            name: '',
            relativePath: '/',
            isFolder: true,
            children: [
              {
                name: 'a.txt',
                relativePath: '/a.txt',
                isFolder: false,
                children: []
              }
            ]
          }
        }),
        save: async () => ({ status: 'success' }) as never,
        read: async () => ({ contents: 'first', binary: false }),
        update: async (_path: string, contents: string | Uint8Array) => {
          updates.push(contents)

          return { status: 'success' } as never
        }
      } as never

      return services
    })

    // the id is the estate's: a file PUT names a file the estate already holds
    const uploaded = await request(mount)
      .post('/files/files')
      .attach('file', Buffer.from('first'), 'a.txt')

    expect(uploaded.status).toBe(201)

    const id = uploaded.body.id as string

    const answer = await request(mount)
      .put(`/files/files/${id}/content`)
      .set('Content-Type', 'text/plain')
      .send('second')

    expect(answer.status).toBe(200)
    expect(updates).toHaveLength(1)
    expect(Buffer.from(updates[0] as Uint8Array).toString()).toBe('second')
  })

  /**
   * A file PUT is the one path `express.json`'s limit does not bound, because the
   * parser never reads a content type it does not parse. The mount counts the
   * bytes itself and refuses past the cap it states - and the SAME request at the
   * cap is answered, so the case pins where the boundary is rather than only that
   * something large is refused.
   */
  it('refuses a file content past the cap, and answers one at it', async () => {
    const updates: string[] = []

    const mount = app(
      () => {
        const services = withExecution('[]', '')

        services.drive = {
          tree: async () => ({
            status: 'success',
            tree: {
              name: '',
              relativePath: '/',
              isFolder: true,
              children: [
                {
                  name: 'a.txt',
                  relativePath: '/a.txt',
                  isFolder: false,
                  children: []
                }
              ]
            }
          }),
          save: async () => ({ status: 'success' }) as never,
          read: async () => ({ contents: 'first', binary: false }),
          update: async (_path: string, contents: string | Uint8Array) => {
            updates.push(String(contents))

            return { status: 'success' } as never
          }
        } as never

        return services
      },
      { contentBytes: 8 }
    )

    const uploaded = await request(mount)
      .post('/files/files')
      .attach('file', Buffer.from('first'), 'a.txt')

    expect(uploaded.status).toBe(201)

    const id = uploaded.body.id as string

    const atCap = await request(mount)
      .put(`/files/files/${id}/content`)
      .set('Content-Type', 'text/plain')
      .send('12345678')

    expect(atCap.status).toBe(200)
    expect(updates).toEqual(['12345678'])

    const pastCap = await request(mount)
      .put(`/files/files/${id}/content`)
      .set('Content-Type', 'text/plain')
      .send('123456789')

    expect(pastCap.status).toBe(413)
    // 413 is this mount's answer for a body past a ceiling, on this route and on
    // the upload route alike: one class of refusal, one number
    expect(pastCap.body).toEqual(
      emulatedRefusal(413, "A file's content must not exceed 8 bytes.")
    )
    expect(updates).toEqual(['12345678'])
  })

  /**
   * A `.json` file is a file like any other: `updateFileContent` sends its own
   * content type, which for one of those is `application/json`. A JSON parser
   * consumes that body and hands on an object - or refuses it, when the file is
   * not itself valid JSON - so the bytes have to be taken before the parser runs,
   * for every content type rather than the text ones only.
   */
  it("reads a json file's content as bytes, not as a parsed body", async () => {
    const updates: string[] = []
    // deliberately not valid JSON: a file's bytes are not required to parse
    const content = '{ this is not json'

    const mount = app(() => {
      const services = withExecution('[]', '')

      services.drive = {
        tree: async () => ({
          status: 'success',
          tree: {
            name: '',
            relativePath: '/',
            isFolder: true,
            children: [
              {
                name: 'a.json',
                relativePath: '/a.json',
                isFolder: false,
                children: []
              }
            ]
          }
        }),
        save: async () => ({ status: 'success' }) as never,
        read: async () => ({ contents: content, binary: false }),
        update: async (_path: string, contents: string | Uint8Array) => {
          updates.push(Buffer.from(contents as Uint8Array).toString())

          return { status: 'success' } as never
        }
      } as never

      return services
    })

    const uploaded = await request(mount)
      .post('/files/files')
      .attach('file', Buffer.from(content), 'a.json')

    expect(uploaded.status).toBe(201)

    const id = uploaded.body.id as string

    const answer = await request(mount)
      .put(`/files/files/${id}/content`)
      .set('Content-Type', 'application/json')
      .send(content)

    expect(answer.status).toBe(200)
    expect(updates).toEqual([content])
  })

  it('answers a request with no file part with the emulator own 400', async () => {
    const answer = await request(app(() => withExecution('[]', ''))).post(
      '/files/files'
    )

    expect(answer.status).toBe(400)
    expect(answer.body.message).toMatch(/file/i)
  })
})
