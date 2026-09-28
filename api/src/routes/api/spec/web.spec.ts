import fs from 'fs-extra'
import path from 'path'
import { Express } from 'express'
import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'
import appPromise from '../../../app'
import { UserController, ClientController } from '../../../controllers/'
import {
  BUNDLE_NAME,
  bundleVersionFor,
  getWebBuildFolder
} from '../../../utils'

const clientId = 'someclientID'
const clientSecret = 'someclientSecret'
const user = {
  id: 1234,
  displayName: 'Test User',
  username: 'testusername',
  password: '87654321',
  isAdmin: false,
  isActive: true
}

describe('web', () => {
  let app: Express
  let con: Mongoose
  let mongoServer: MongoMemoryServer
  const userController = new UserController()
  const clientController = new ClientController()

  beforeAll(async () => {
    app = await appPromise

    mongoServer = await MongoMemoryServer.create()
    con = await mongoose.connect(mongoServer.getUri())
    await clientController.createClient({ clientId, clientSecret })
  })

  afterAll(async () => {
    await con.connection.dropDatabase()
    await con.connection.close()
    await mongoServer.stop()
  })

  describe('home', () => {
    // The web build is a gitignored build artifact, absent in CI, so this
    // suite lays down the two files the route reads and puts back whatever it
    // found. Nothing else in the suite depends on their contents.
    const buildFolder = getWebBuildFolder()
    const indexHtml = path.join(buildFolder, 'index.html')
    const bundlePath = path.join(buildFolder, BUNDLE_NAME)
    const page =
      '<html><head><script defer src=./index.bundle.js></script></head><body><div id=root></div></body></html>'
    const bundle = 'console.log("the built bundle")'
    const originals = new Map<string, Buffer>()

    beforeAll(async () => {
      await fs.ensureDir(buildFolder)

      for (const file of [indexHtml, bundlePath]) {
        if (await fs.pathExists(file))
          originals.set(file, await fs.readFile(file))
      }

      await fs.writeFile(indexHtml, page)
      await fs.writeFile(bundlePath, bundle)
    })

    afterAll(async () => {
      for (const file of [indexHtml, bundlePath]) {
        if (originals.has(file)) await fs.writeFile(file, originals.get(file)!)
        else await fs.remove(file)
      }
    })

    it('should respond with CSRF Token as a cookie, with no inline script in the page', async () => {
      const res = await request(app).get('/').expect(200)

      const xsrfCookie = (
        res.headers['set-cookie'] as unknown as string[]
      ).find((cookie) => cookie.startsWith('XSRF-TOKEN='))

      expect(xsrfCookie).toBeDefined()
      expect(xsrfCookie).toMatch(
        /^XSRF-TOKEN=[^;]+; Max-Age=86400; Path=\/; Expires=.*; SameSite=Strict/
      )

      // The cookie is the whole delivery mechanism: an inline script would
      // require 'unsafe-inline' in the CSP.
      expect(res.text).not.toContain('<script>document.cookie')
    })

    it('should reference the bundle by its contents, so a cached bundle is not reused', async () => {
      const res = await request(app).get('/').expect(200)

      // The defect this guards: the page referenced a fixed `index.bundle.js`,
      // so a returning browser rendered the previous release's UI.
      expect(res.text).toContain(
        `src=./${BUNDLE_NAME}?v=${bundleVersionFor(bundle)}`
      )
    })
  })

  describe('SASLogon/authorize', () => {
    let csrfToken: string
    let agent: ReturnType<typeof request.agent>

    beforeAll(async () => {
      // One agent = one session across token mint, login and authorize: the
      // per-session CSRF secret requires the token to travel with the
      // session cookie that minted it.
      agent = request.agent(app)
      ;({ csrfToken } = await getCSRF(agent as any))

      await userController.createUser(user)

      const credentials = {
        username: user.username,
        password: user.password
      }

      await agent
        .post('/SASLogon/login')
        .set('x-xsrf-token', csrfToken)
        .send(credentials)
    })

    afterAll(async () => {
      const collections = mongoose.connection.collections
      const collection = collections['users']
      await collection.deleteMany({})
    })

    it('should respond with authorization code', async () => {
      const res = await agent
        .post('/SASLogon/authorize')
        .set('x-xsrf-token', csrfToken)
        .send({ clientId })

      expect(res.body).toHaveProperty('code')
    })

    it('should respond with Bad Request if CSRF Token is missing', async () => {
      const res = await agent
        .post('/SASLogon/authorize')
        .send({ clientId })
        .expect(400)

      expect(res.text).toEqual('Invalid CSRF token!')
      expect(res.body).toEqual({})
    })

    it('should respond with Bad Request if clientId is missing', async () => {
      const res = await agent
        .post('/SASLogon/authorize')
        .set('x-xsrf-token', csrfToken)
        .send({})
        .expect(400)

      expect(res.text).toEqual(`"clientId" is required`)
      expect(res.body).toEqual({})
    })

    it('should respond with Forbidden if clientId is incorrect', async () => {
      const res = await agent
        .post('/SASLogon/authorize')
        .set('x-xsrf-token', csrfToken)
        .send({
          clientId: 'WrongClientID'
        })
        .expect(403)

      expect(res.text).toEqual('Error: Invalid clientId.')
      expect(res.body).toEqual({})
    })
  })

  describe('SASLogon/login', () => {
    // CSRF tokens are bound to the session that minted them (per-session
    // secret), so every request that presents a token must carry the same
    // session cookie - a cookie jar (agent) does that.
    const loginAgentWithToken = async () => {
      const agent = request.agent(app)
      const { csrfToken } = await getCSRF(agent as any)
      return { agent, csrfToken }
    }

    afterEach(async () => {
      const collections = mongoose.connection.collections
      const collection = collections['users']
      await collection.deleteMany({})
    })

    it('should respond with successful login', async () => {
      await userController.createUser(user)

      const { agent, csrfToken } = await loginAgentWithToken()

      const res = await agent
        .post('/SASLogon/login')
        .set('x-xsrf-token', csrfToken)
        .send({
          username: user.username,
          password: user.password
        })
        .expect(200)

      expect(res.body.loggedIn).toBeTruthy()
      expect(res.body.user).toEqual({
        uid: expect.any(String),
        username: user.username,
        displayName: user.displayName,
        isAdmin: user.isAdmin,
        needsToUpdatePassword: true
      })
    })

    it('should respond with Bad Request if CSRF Token is not present', async () => {
      await userController.createUser(user)

      const res = await request(app)
        .post('/SASLogon/login')
        .send({
          username: user.username,
          password: user.password
        })
        .expect(400)

      expect(res.text).toEqual('Invalid CSRF token!')
      expect(res.body).toEqual({})
    })

    it('should respond with Bad Request if CSRF Token is invalid', async () => {
      await userController.createUser(user)

      const res = await request(app)
        .post('/SASLogon/login')
        .set('x-xsrf-token', 'INVALID_CSRF_TOKEN')
        .send({
          username: user.username,
          password: user.password
        })
        .expect(400)

      expect(res.text).toEqual('Invalid CSRF token!')
      expect(res.body).toEqual({})
    })
  })
})

const getCSRF = async (appOrAgent: any) => {
  // make request to get CSRF. Accepts a supertest agent so the token is
  // minted in the SAME session whose cookie jar will present it.
  const { headers } = await appOrAgent.get('/')

  return { csrfToken: extractCSRF(headers) }
}

const extractCSRF = (headers: { [key: string]: any }): string =>
  /XSRF-TOKEN=(.*?);/.exec(
    (headers['set-cookie'] as string[] | undefined)?.join(';') ?? ''
  )![1]
