/**
 * The flow a Viya client actually walks, end to end.
 *
 * The browser signs a user in at `POST /SASLogon/login`, asks
 * `POST /SASLogon/authorize` for a code, and exchanges it at
 * `POST /SASLogon/oauth/token`. The installed Viya adapter's `getAuthCode`
 * instead fetches `GET /SASLogon/oauth/authorize` in an existing session; it
 * cannot submit a login form. The browser E2E spec exercises the real adapter.
 * Each route has a case of its own
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
import User from '../../../model/User'
import { configureExpressSession } from '../../../app-modules'
import { ModeType, SECRETS } from '../../../utils'
import { UserController, WebController } from '../../../controllers/'

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

    // a code is a bearer credential, single-use: a proxy must not replay the page
    expect(page.headers['cache-control']).toBe('no-store')
    expect(page.headers['pragma']).toBe('no-cache')

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

  it('refuses authorization when a signed-in user is deactivated', async () => {
    const agent = request.agent(app)
    const csrf = extractCSRF((await agent.get('/')).headers)
    expect(
      (
        await agent.post('/SASLogon/login').set('x-xsrf-token', csrf).send({
          username: account.username,
          password: account.password
        })
      ).status
    ).toBe(200)

    await User.updateOne({ username: account.username }, { isActive: false })
    try {
      const answer = await agent.get(
        `/SASLogon/oauth/authorize?client_id=${CLIENT_ID}&response_type=code`
      )
      expect(answer.status).toBe(401)
      expect(answer.text).not.toContain('<h4>')
      expect(answer.headers['cache-control']).toBe('no-store')
    } finally {
      await User.updateOne({ username: account.username }, { isActive: true })
    }
  })

  it('applies the initial admin password gate to the authorize page', async () => {
    const previousAdmin = process.env.ADMIN_USERNAME
    process.env.ADMIN_USERNAME = account.username
    await User.updateOne(
      { username: account.username },
      { needsToUpdatePassword: true }
    )
    try {
      const agent = request.agent(app)
      const csrf = extractCSRF((await agent.get('/')).headers)
      const login = await agent
        .post('/SASLogon/login')
        .set('x-xsrf-token', csrf)
        .send({ username: account.username, password: account.password })
      expect(login.status).toBe(200)
      const answer = await agent.get(
        `/SASLogon/oauth/authorize?client_id=${CLIENT_ID}&response_type=code`
      )
      expect(answer.status).toBe(403)
      expect(answer.text).toBe('Password update required')
      expect(answer.headers['cache-control']).toBe('no-store')
    } finally {
      if (previousAdmin === undefined) delete process.env.ADMIN_USERNAME
      else process.env.ADMIN_USERNAME = previousAdmin
    }
  })

  it.each([
    ['viya', false],
    ['viya', true],
    ['native', false],
    ['native', true]
  ] as const)(
    'refuses a %s code exchange after deactivation (existing pair: %s)',
    async (port, existingPair) => {
      await User.updateOne({ username: account.username }, { tokens: [] })
      const agent = request.agent(app)
      const csrf = extractCSRF((await agent.get('/')).headers)
      const login = await agent
        .post('/SASLogon/login')
        .set('x-xsrf-token', csrf)
        .send({ username: account.username, password: account.password })
      expect(login.status).toBe(200)

      if (existingPair) {
        const first = await agent
          .post('/SASLogon/authorize')
          .set('x-xsrf-token', csrf)
          .send({ clientId: CLIENT_ID })
        expect(first.status).toBe(200)
        const pair = await request(app)
          .post('/SASLogon/oauth/token')
          .auth(CLIENT_ID, CLIENT_SECRET)
          .type('form')
          .send({ grant_type: 'authorization_code', code: first.body.code })
        expect(pair.status).toBe(200)
      }

      const authorized = await agent
        .post('/SASLogon/authorize')
        .set('x-xsrf-token', csrf)
        .send({ clientId: CLIENT_ID })
      expect(authorized.status).toBe(200)
      const code = authorized.body.code
      expect(typeof code).toBe('string')
      await User.updateOne({ username: account.username }, { isActive: false })
      try {
        const answer =
          port === 'viya'
            ? await request(app)
                .post('/SASLogon/oauth/token')
                .auth(CLIENT_ID, CLIENT_SECRET)
                .type('form')
                .send({ grant_type: 'authorization_code', code })
            : await request(app)
                .post('/SASjsApi/auth/token')
                .send({ clientId: CLIENT_ID, code })
        expect(answer.status).toBe(401)
        expect(
          answer.body.access_token ?? answer.body.accessToken
        ).toBeUndefined()
        expect(
          answer.body.refresh_token ?? answer.body.refreshToken
        ).toBeUndefined()
        if (port === 'viya') expect(answer.body.error).toBe('invalid_grant')
      } finally {
        await User.updateOne({ username: account.username }, { isActive: true })
      }
      // A refused code cannot be revived by reactivating the account.
      const replay =
        port === 'viya'
          ? await request(app)
              .post('/SASLogon/oauth/token')
              .auth(CLIENT_ID, CLIENT_SECRET)
              .type('form')
              .send({ grant_type: 'authorization_code', code })
          : await request(app)
              .post('/SASjsApi/auth/token')
              .send({ clientId: CLIENT_ID, code })
      expect(replay.status).toBe(401)
    }
  )

  it('sends a fresh browser to the login UI with the authorization request intact', async () => {
    const answer = await request(app).get(
      `/SASLogon/oauth/authorize?client_id=${CLIENT_ID}&response_type=code`
    )

    expect(answer.status).toBe(302)
    expect(answer.headers.location).toBe(
      `/logon?client_id=${CLIENT_ID}&response_type=code`
    )
    expect(answer.headers['cache-control']).toBe('no-store')
    expect(answer.headers.pragma).toBe('no-cache')
  })

  it('encodes untrusted client ids and never redirects to a supplied URL', async () => {
    const clientId = '//evil.example/?x=1&y=2#frag'
    const query = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: 'https://evil.example/'
    })
    const answer = await request(app).get(`/SASLogon/oauth/authorize?${query}`)
    expect(answer.status).toBe(302)
    const target = new URL(answer.headers.location, 'http://localhost')
    expect(target.origin).toBe('http://localhost')
    expect(target.pathname).toBe('/logon')
    expect(target.searchParams.get('client_id')).toBe(clientId)
    expect(target.searchParams.get('response_type')).toBe('code')
    expect(target.searchParams.has('redirect_uri')).toBe(false)
  })

  it.each([
    '',
    '?client_id=x',
    '?response_type=code',
    '?client_id=x&response_type=token',
    '?client_id=x&response_type=code&response_type=code'
  ])('rejects invalid authorize query %s', async (query) => {
    const answer = await request(app).get(`/SASLogon/oauth/authorize${query}`)
    expect(answer.status).toBe(400)
    expect(answer.headers['cache-control']).toBe('no-store')
  })

  it('rejects duplicate client ids rather than treating them as one value', async () => {
    const answer = await request(app).get(
      '/SASLogon/oauth/authorize?client_id=one&client_id=two&response_type=code'
    )
    expect(answer.status).toBe(400)
    expect(answer.headers['cache-control']).toBe('no-store')
  })

  it('refuses the authorize URL to an unknown client', async () => {
    // the other refusal this route carries to a browser, and the one no case
    // exercised on this verb: the caller is signed in, the client is not on the
    // estate
    const agent = request.agent(app)
    const csrf = extractCSRF((await agent.get('/')).headers)

    await agent
      .post('/SASLogon/login')
      .set('x-xsrf-token', csrf)
      .send({ username: account.username, password: account.password })

    const answer = await agent.get(
      '/SASLogon/oauth/authorize?client_id=notRegistered&response_type=code'
    )

    expect(answer.status).toBe(403)
    expect(answer.text).toBe('Invalid clientId.')
  })

  it('answers an unexpected failure as a 500 with no driver message', async () => {
    // the route answers a page, but the decision is the shared one: a driver
    // error's own status and message must not reach the browser
    const agent = request.agent(app)
    const csrf = extractCSRF((await agent.get('/')).headers)

    await agent
      .post('/SASLogon/login')
      .set('x-xsrf-token', csrf)
      .send({ username: account.username, password: account.password })

    const spy = jest
      .spyOn(WebController.prototype, 'authorize')
      .mockRejectedValueOnce({
        code: 'ENOENT',
        status: 0,
        message: 'mongodb: internal detail'
      } as never)

    try {
      const answer = await agent.get(
        `/SASLogon/oauth/authorize?client_id=${CLIENT_ID}&response_type=code`
      )

      expect(answer.status).toBe(500)
      expect(answer.text).toBe('Internal Server Error')
    } finally {
      spy.mockRestore()
    }
  })

  it('returns authorization codes with no-store headers', async () => {
    const agent = request.agent(app)
    const csrf = extractCSRF((await agent.get('/')).headers)
    await agent
      .post('/SASLogon/login')
      .set('x-xsrf-token', csrf)
      .send({ username: account.username, password: account.password })
    const answer = await agent
      .post('/SASLogon/authorize')
      .set('x-xsrf-token', csrf)
      .send({ clientId: CLIENT_ID })
    expect(answer.status).toBe(200)
    expect(answer.headers['cache-control']).toBe('no-store')
    expect(answer.headers.pragma).toBe('no-cache')
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
