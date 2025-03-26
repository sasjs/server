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
    let authCookies: string

    beforeAll(async () => {
      ;({ csrfToken } = await getCSRF(app))

      await userController.createUser(user)

      const credentials = {
        username: user.username,
        password: user.password
      }

      ;({ authCookies } = await performLogin(app, credentials, csrfToken))
    })

    afterAll(async () => {
      const collections = mongoose.connection.collections
      const collection = collections['users']
      await collection.deleteMany({})
    })

    it('should respond with authorization code', async () => {
      const res = await request(app)
        .post('/SASLogon/authorize')
        .set('Cookie', [authCookies].join('; '))
        .set('x-xsrf-token', csrfToken)
        .send({ clientId })

      expect(res.body).toHaveProperty('code')
    })

    it('should respond with Bad Request if CSRF Token is missing', async () => {
      const res = await request(app)
        .post('/SASLogon/authorize')
        .set('Cookie', [authCookies].join('; '))
        .send({ clientId })
        .expect(400)

      expect(res.text).toEqual('Invalid CSRF token!')
      expect(res.body).toEqual({})
    })

    it('should respond with Bad Request if clientId is missing', async () => {
      const res = await request(app)
        .post('/SASLogon/authorize')
        .set('Cookie', [authCookies].join('; '))
        .set('x-xsrf-token', csrfToken)
        .send({})
        .expect(400)

      expect(res.text).toEqual(`"clientId" is required`)
      expect(res.body).toEqual({})
    })

    it('should respond with Forbidden if clientId is incorrect', async () => {
      const res = await request(app)
        .post('/SASLogon/authorize')
        .set('Cookie', [authCookies].join('; '))
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
    let csrfToken: string

    beforeAll(async () => {
      ;({ csrfToken } = await getCSRF(app))
    })

    afterEach(async () => {
      const collections = mongoose.connection.collections
      const collection = collections['users']
      await collection.deleteMany({})
    })

    it('should respond with successful login', async () => {
      await userController.createUser(user)

      const res = await request(app)
        .post('/SASLogon/login')
        .set('x-xsrf-token', csrfToken)
        .send({
          username: user.username,
          password: user.password
        })
        .expect(200)

      expect(res.body.loggedIn).toBeTruthy()
      expect(res.body.user).toEqual({
        id: expect.any(String),
        username: user.username,
        displayName: user.displayName,
        isAdmin: user.isAdmin,
        needsToUpdatePassword: true
      })
    })

    it('should respond with too many requests when attempting with invalid password for a same user too many times', async () => {
      await userController.createUser(user)

      const promises: request.Test[] = []

      const maxConsecutiveFailsByUsernameAndIp = Number(
        process.env.MAX_CONSECUTIVE_FAILS_BY_USERNAME_AND_IP
      )

      Array(maxConsecutiveFailsByUsernameAndIp + 1)
        .fill(0)
        .map((_, i) => {
          promises.push(
            request(app)
              .post('/SASLogon/login')
              .set('x-xsrf-token', csrfToken)
              .send({
                username: user.username,
                password: 'invalid-password'
              })
          )
        })

      await Promise.all(promises)

      const res = await request(app)
        .post('/SASLogon/login')
        .set('x-xsrf-token', csrfToken)
        .send({
          username: user.username,
          password: user.password
        })
        .expect(429)

      expect(res.text).toContain('Too Many Requests!')
    })

    it('should respond with too many requests when attempting with invalid credentials for different users but with same ip too many times', async () => {
      await userController.createUser(user)

      const promises: request.Test[] = []

      const maxWrongAttemptsByIpPerDay = Number(
        process.env.MAX_WRONG_ATTEMPTS_BY_IP_PER_DAY
      )

      Array(maxWrongAttemptsByIpPerDay + 1)
        .fill(0)
        .map((_, i) => {
          promises.push(
            request(app)
              .post('/SASLogon/login')
              .set('x-xsrf-token', csrfToken)
              .send({
                username: `user${i}`,
                password: 'invalid-password'
              })
          )
        })

      await Promise.all(promises)

      const res = await request(app)
        .post('/SASLogon/login')
        .set('x-xsrf-token', csrfToken)
        .send({
          username: user.username,
          password: user.password
        })
        .expect(429)

      expect(res.text).toContain('Too Many Requests!')
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

const getCSRF = async (app: Express) => {
  // make request to get CSRF
  const { text } = await request(app).get('/')

  return { csrfToken: extractCSRF(text) }
}

const performLogin = async (
  app: Express,
  credentials: { username: string; password: string },
  csrfToken: string
) => {
  const { header } = await request(app)
    .post('/SASLogon/login')
    .set('x-xsrf-token', csrfToken)
    .send(credentials)

  return { authCookies: header['set-cookie'].join() }
}

const extractCSRF = (text: string) =>
  /<script>document.cookie = 'XSRF-TOKEN=(.*); Max-Age=86400; SameSite=Strict; Path=\/;'<\/script>/.exec(
    text
  )![1]
