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
  username: 'testUsername',
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
      await request(app)
        .get('/')
        .expect(
          'set-cookie',
          /_csrf=.*; Max-Age=86400000; Path=\/; HttpOnly,XSRF-TOKEN=.*; Path=\//
        )
    })
  })

  describe('SASLogon/login', () => {
    let csrfToken: string
    let cookies: string

    beforeAll(async () => {
      ;({ csrfToken, cookies } = await getCSRF(app))
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
        .set('Cookie', cookies)
        .set('x-xsrf-token', csrfToken)
        .send({
          username: user.username,
          password: user.password
        })
        .expect(200)

      expect(res.body.loggedIn).toBeTruthy()
      expect(res.body.user).toEqual({
        username: user.username,
        displayName: user.displayName
      })
    })
  })

  describe('SASLogon/authorize', () => {
    let csrfToken: string
    let cookies: string
    let authCookies: string

    beforeAll(async () => {
      ;({ csrfToken, cookies } = await getCSRF(app))

      await userController.createUser(user)

      const credentials = {
        username: user.username,
        password: user.password
      }

      ;({ cookies: authCookies } = await performLogin(
        app,
        credentials,
        cookies,
        csrfToken
      ))
    })

    afterAll(async () => {
      const collections = mongoose.connection.collections
      const collection = collections['users']
      await collection.deleteMany({})
    })

    it('should respond with authorization code', async () => {
      const res = await request(app)
        .post('/SASLogon/authorize')
        .set('Cookie', [authCookies, cookies].join('; '))
        .set('x-xsrf-token', csrfToken)
        .send({ clientId })

      expect(res.body).toHaveProperty('code')
    })

    it('should respond with Bad Request if clientId is missing', async () => {
      const res = await request(app)
        .post('/SASLogon/authorize')
        .set('Cookie', [authCookies, cookies].join('; '))
        .set('x-xsrf-token', csrfToken)
        .send({})
        .expect(400)

      expect(res.text).toEqual(`"clientId" is required`)
      expect(res.body).toEqual({})
    })

    it('should respond with Forbidden if clientId is incorrect', async () => {
      const res = await request(app)
        .post('/SASLogon/authorize')
        .set('Cookie', [authCookies, cookies].join('; '))
        .set('x-xsrf-token', csrfToken)
        .send({
          clientId: 'WrongClientID'
        })
        .expect(403)

      expect(res.text).toEqual('Error: Invalid clientId.')
      expect(res.body).toEqual({})
    })
  })
})

const getCSRF = async (app: Express) => {
  // make request to get CSRF
  const { header } = await request(app).get('/')
  const cookies = header['set-cookie'].join()

  console.log('cookies', cookies)
  const csrfToken = extractCSRF(cookies)
  return { csrfToken, cookies }
}

const performLogin = async (
  app: Express,
  credentials: { username: string; password: string },
  cookies: string,
  csrfToken: string
) => {
  const { header } = await request(app)
    .post('/SASLogon/login')
    .set('Cookie', cookies)
    .set('x-xsrf-token', csrfToken)
    .send(credentials)

  const newCookies: string = header['set-cookie'].join()
  return { cookies: newCookies }
}

const extractCSRF = (cookies: string) =>
  /_csrf=(.*); Max-Age=86400000; Path=\/; HttpOnly,XSRF-TOKEN=(.*); Path=\//.exec(
    cookies
  )![2]
