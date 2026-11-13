import express from 'express'
import { mkdtemp, readdir } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import request from 'supertest'

import { createViyaRouter, isViyaPath, ruleFor, viyaGuard } from '../index'
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

const app = (services: (req: express.Request) => Services) => {
  const server = express()

  server.use(express.json())
  server.use('/', createViyaRouter(services))
  // what the server's own routes would answer for anything the router declines
  server.use('/', (_req, res) => res.status(418).json({ message: 'not viya' }))

  return server
}

describe('the Viya mount', () => {
  it('answers the paths a Viya client uses, with the emulated header', async () => {
    const answer = await request(app(() => withExecution('[]', ''))).get(
      '/compute/contexts'
    )

    expect(answer.status).toBe(200)
    expect(answer.headers['x-sasjs-emulated']).toMatch(/^viya@/)
    expect(answer.body.items[0].name).toBeTruthy()
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

const refuses = (req: express.Request, res: express.Response) =>
  res.status(401).json({ message: 'no token' })

describe('who may reach the estate', () => {
  it('guards a path that runs caller code', async () => {
    const answer = await request(guardApp(refuses)).post(
      '/compute/contexts/x/sessions'
    )

    expect(answer.status).toBe(401)
  })

  it('leaves the application shell to the web router, unauthenticated', async () => {
    // the guard used to sit at the root, which turned `GET /` into a 401 and
    // left a caller no way to reach the login page
    const answer = await request(guardApp(refuses)).get('/')

    expect(answer.status).toBe(200)
    expect(answer.text).toBe('the app shell')
  })

  it('leaves the estate own login open, or nobody could ever sign in', async () => {
    // a client that signs in the Viya way holds no sasjs/server token; guarding
    // this path refused the very request that fetches one
    const answer = await request(guardApp(refuses)).post(
      '/SASLogon/oauth/token'
    )

    expect(answer.status).not.toBe(401)
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

  it('answers a request with no part with the emulator error, not the parser text', async () => {
    const answer = await request(app(() => withExecution('[]', ''))).post(
      '/files/files'
    )

    expect(answer.status).toBe(400)
    expect(answer.body.message).toMatch(/file/i)
  })
})
