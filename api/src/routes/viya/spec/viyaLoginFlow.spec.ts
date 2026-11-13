/**
 * The flow a Viya client actually walks, end to end.
 *
 * `@sasjs/adapter` signs a user in at `POST /SASLogon/login`, asks
 * `POST /SASLogon/authorize` for a code, and exchanges it at
 * `POST /SASLogon/oauth/token`. Each of those routes has a case of its own
 * elsewhere; what this file proves is that the three are reachable TOGETHER with
 * `EMULATE_VIYA` on - the mount at `/` sits in front of the web router, so a
 * prefix match on `/SASLogon` once shadowed the sign-in and answered
 * `404 No operation is emulated`, leaving the code grant with nothing to feed it.
 *
 * The requests are the adapter's: a session agent carries the CSRF cookie the
 * login requires, and the token request is form-encoded with Basic auth.
 */
import cookieParser from 'cookie-parser'
import express, { Express } from 'express'
import { mkdtemp } from 'fs/promises'
import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { tmpdir } from 'os'
import { join } from 'path'
import request from 'supertest'

import Client from '../../../model/Client'
import { configureExpressSession } from '../../../app-modules'
import { ModeType, SECRETS } from '../../../utils'
import { UserController } from '../../../controllers/'

const CLIENT_ID = 'flowClient'
const CLIENT_SECRET = 'flowClientSecret'

const extractCSRF = (headers: { [key: string]: any }): string =>
  /XSRF-TOKEN=(.*?);/.exec(
    (headers['set-cookie'] as string[] | undefined)?.join(';') ?? ''
  )![1]

describe('the Viya sign-in flow, with the estate mounted', () => {
  let app: Express
  let con: Mongoose
  let mongoServer: MongoMemoryServer
  const userController = new UserController()

  const account = {
    displayName: 'Flow User',
    username: 'flowuser',
    password: 'userPassword',
    isAdmin: false,
    isActive: true
  }

  beforeAll(async () => {
    const root = await mkdtemp(join(tmpdir(), 'viya-flow-'))

    process.sasjsRoot = root
    process.driveLoc = join(root, 'drive')
    process.logsLoc = join(root, 'logs')
    process.env.MODE = ModeType.Server
    process.env.EMULATE_VIYA = 'true'
    process.secrets = SECRETS

    mongoServer = await MongoMemoryServer.create()
    con = await mongoose.connect(mongoServer.getUri())

    await userController.createUser(account)
    await Client.create({ clientId: CLIENT_ID, clientSecret: CLIENT_SECRET })

    const server = express()

    // what `app.ts` puts in front of the routes, and what the sign-in needs: the
    // login writes a session, and the CSRF check reads the cookie beside it
    server.use(cookieParser())
    server.use(express.json())
    configureExpressSession(server)

    const { setupRoutes } = await import('../../setupRoutes')

    await setupRoutes(server)
    app = server
  })

  afterAll(async () => {
    await con.connection.dropDatabase()
    await con.connection.close()
    await mongoServer.stop()
  })

  it('answers the authorize URL with the page the adapter parses', async () => {
    // `@sasjs/adapter` does not post: it opens
    // `/SASLogon/oauth/authorize?client_id=...&response_type=code` and reads the
    // code out of `.infobox h4` in the page it gets back
    const agent = request.agent(app)
    const csrf = extractCSRF((await agent.get('/')).headers)

    await agent
      .post('/SASLogon/login')
      .set('x-xsrf-token', csrf)
      .send({ username: account.username, password: account.password })

    const page = await agent.get(
      `/SASLogon/oauth/authorize?client_id=${CLIENT_ID}&response_type=code`
    )

    expect(page.status).toBe(200)
    expect(page.headers['content-type']).toMatch(/html/)

    // the adapter's own parse, rather than a JSON field this server invented
    const body = page.text.split('<body>')[1].split('</body>')[0]
    const code = /<h4>(.*?)<\/h4>/.exec(body)?.[1]

    expect(code).toBeTruthy()

    const exchanged = await request(app)
      .post('/SASLogon/oauth/token')
      .set(
        'Authorization',
        'Basic ' +
          Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
      )
      .type('form')
      .send({ grant_type: 'authorization_code', code })

    expect(exchanged.status).toBe(200)
    expect(typeof exchanged.body.access_token).toBe('string')
  })

  it('refuses the authorize URL to a caller with no session', async () => {
    // the estate renders its own login page for this case; this server does not,
    // so the answer says what is missing rather than serving an empty form
    const answer = await request(app).get(
      `/SASLogon/oauth/authorize?client_id=${CLIENT_ID}&response_type=code`
    )

    expect(answer.status).toBe(401)
    expect(answer.text).toMatch(/userId|session/i)
  })

  it('signs in, takes a code, and exchanges it for a pair', async () => {
    // one agent: the CSRF token and the session that mints it travel together
    const agent = request.agent(app)
    const csrf = extractCSRF((await agent.get('/')).headers)

    const signIn = await agent
      .post('/SASLogon/login')
      .set('x-xsrf-token', csrf)
      .send({ username: account.username, password: account.password })

    // the web router answered: the emulator's answer to this path would be a 404
    // naming an operation it does not carry
    expect(signIn.status).toBe(200)
    expect(signIn.body.loggedIn).toBe(true)

    const authorized = await agent
      .post('/SASLogon/authorize')
      .set('x-xsrf-token', csrf)
      .send({ clientId: CLIENT_ID })

    expect(authorized.status).toBe(200)
    expect(typeof authorized.body.code).toBe('string')

    const exchanged = await request(app)
      .post('/SASLogon/oauth/token')
      .set(
        'Authorization',
        'Basic ' +
          Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
      )
      .type('form')
      .send({ grant_type: 'authorization_code', code: authorized.body.code })

    expect(exchanged.status).toBe(200)
    expect(typeof exchanged.body.access_token).toBe('string')
    expect(typeof exchanged.body.refresh_token).toBe('string')

    // and the token it issued is the one this server accepts on the estate's own
    // paths, which is the whole point of the flow
    const whoami = await request(app)
      .get('/identities/users/@currentUser')
      .set('Authorization', `Bearer ${exchanged.body.access_token}`)

    expect(whoami.status).toBe(200)
    expect(whoami.body.id).toBeTruthy()
  })
})
