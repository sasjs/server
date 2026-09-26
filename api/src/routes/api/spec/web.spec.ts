import { Express } from 'express'
import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'
import appPromise from '../../../app'
import { UserController, ClientController } from '../../../controllers/'

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
    it('should respond with CSRF Token', async () => {
      const res = await request(app).get('/').expect(200)

      expect(res.text).toMatch(
        /<script>document.cookie = '(XSRF-TOKEN=.*; Max-Age=86400; SameSite=Strict; Path=\/;)'<\/script>/
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
  const { text } = await appOrAgent.get('/')

  return { csrfToken: extractCSRF(text) }
}

const extractCSRF = (text: string) =>
  /<script>document.cookie = 'XSRF-TOKEN=(.*); Max-Age=86400; SameSite=Strict; Path=\/;'<\/script>/.exec(
    text
  )![1]
