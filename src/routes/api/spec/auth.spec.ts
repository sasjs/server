import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'
import app from '../../../app'
import UserController from '../../../controllers/user'
import ClientController from '../../../controllers/client'
import {
  generateAccessToken,
  generateAuthCode,
  generateRefreshToken,
  populateClients,
  saveCode
} from '../auth'
import { InfoJWT } from '../../../types'
import { saveTokensInDB, verifyTokenInDB } from '../../../utils'

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

describe('auth', () => {
  let con: Mongoose
  let mongoServer: MongoMemoryServer
  const userController = new UserController()
  const clientController = new ClientController()

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create()
    con = await mongoose.connect(mongoServer.getUri())
    await clientController.createClient({ clientId, clientSecret })
    await populateClients()
  })

  afterAll(async () => {
    await con.connection.dropDatabase()
    await con.connection.close()
    await mongoServer.stop()
  })

  describe('authorize', () => {
    afterEach(async () => {
      const collections = mongoose.connection.collections
      const collection = collections['users']
      await collection.deleteMany({})
    })

    it('should respond with authorization code', async () => {
      await userController.createUser(user)

      const res = await request(app)
        .post('/SASjsApi/auth/authorize')
        .send({
          username: user.username,
          password: user.password,
          clientId
        })
        .expect(200)

      expect(res.body).toHaveProperty('code')
    })

    it('should respond with Bad Request if username is missing', async () => {
      const res = await request(app)
        .post('/SASjsApi/auth/authorize')
        .send({
          password: user.password,
          clientId
        })
        .expect(400)

      expect(res.text).toEqual(`"username" is required`)
      expect(res.body).toEqual({})
    })

    it('should respond with Bad Request if password is missing', async () => {
      const res = await request(app)
        .post('/SASjsApi/auth/authorize')
        .send({
          username: user.username,
          clientId
        })
        .expect(400)

      expect(res.text).toEqual(`"password" is required`)
      expect(res.body).toEqual({})
    })

    it('should respond with Bad Request if clientId is missing', async () => {
      const res = await request(app)
        .post('/SASjsApi/auth/authorize')
        .send({
          username: user.username,
          password: user.password
        })
        .expect(400)

      expect(res.text).toEqual(`"clientId" is required`)
      expect(res.body).toEqual({})
    })

    it('should respond with Forbidden if username is incorrect', async () => {
      const res = await request(app)
        .post('/SASjsApi/auth/authorize')
        .send({
          username: user.username,
          password: user.password,
          clientId
        })
        .expect(403)

      expect(res.text).toEqual('Username is not found.')
      expect(res.body).toEqual({})
    })

    it('should respond with Forbidden if password is incorrect', async () => {
      await userController.createUser(user)

      const res = await request(app)
        .post('/SASjsApi/auth/authorize')
        .send({
          username: user.username,
          password: 'WrongPassword',
          clientId
        })
        .expect(403)

      expect(res.text).toEqual('Invalid password.')
      expect(res.body).toEqual({})
    })

    it('should respond with Forbidden if clientId is incorrect', async () => {
      await userController.createUser(user)

      const res = await request(app)
        .post('/SASjsApi/auth/authorize')
        .send({
          username: user.username,
          password: user.password,
          clientId: 'WrongClientID'
        })
        .expect(403)

      expect(res.text).toEqual('Invalid clientId.')
      expect(res.body).toEqual({})
    })
  })

  describe('token', () => {
    const userInfo: InfoJWT = {
      clientId,
      userId: user.id
    }
    beforeAll(async () => {
      await userController.createUser(user)
    })
    afterAll(async () => {
      const collections = mongoose.connection.collections
      const collection = collections['users']
      await collection.deleteMany({})
    })

    it('should respond with access and refresh tokens', async () => {
      const code = saveCode(
        userInfo.userId,
        userInfo.clientId,
        generateAuthCode(userInfo)
      )

      const res = await request(app)
        .post('/SASjsApi/auth/token')
        .send({
          clientId,
          code
        })
        .expect(200)

      expect(res.body).toHaveProperty('accessToken')
      expect(res.body).toHaveProperty('refreshToken')
    })

    it('should respond with Bad Request if code is missing', async () => {
      const res = await request(app)
        .post('/SASjsApi/auth/token')
        .send({
          clientId
        })
        .expect(400)

      expect(res.text).toEqual(`"code" is required`)
      expect(res.body).toEqual({})
    })

    it('should respond with Bad Request if clientId is missing', async () => {
      const code = saveCode(
        userInfo.userId,
        userInfo.clientId,
        generateAuthCode(userInfo)
      )

      const res = await request(app)
        .post('/SASjsApi/auth/token')
        .send({
          code
        })
        .expect(400)

      expect(res.text).toEqual(`"clientId" is required`)
      expect(res.body).toEqual({})
    })

    it('should respond with Forbidden if code is invalid', async () => {
      const res = await request(app)
        .post('/SASjsApi/auth/token')
        .send({
          clientId,
          code: 'InvalidCode'
        })
        .expect(403)

      expect(res.body).toEqual({})
    })

    it('should respond with Forbidden if clientId is invalid', async () => {
      const code = saveCode(
        userInfo.userId,
        userInfo.clientId,
        generateAuthCode(userInfo)
      )

      const res = await request(app)
        .post('/SASjsApi/auth/token')
        .send({
          clientId: 'WrongClientID',
          code
        })
        .expect(403)

      expect(res.body).toEqual({})
    })
  })

  describe('refresh', () => {
    let refreshToken: string
    let currentUser: any

    beforeEach(async () => {
      currentUser = await userController.createUser(user)
      refreshToken = generateRefreshToken({
        clientId,
        userId: currentUser.id
      })
      await saveTokensInDB(
        currentUser.id,
        clientId,
        'accessToken',
        refreshToken
      )
    })

    afterEach(async () => {
      const collections = mongoose.connection.collections
      const collection = collections['users']
      await collection.deleteMany({})
    })

    afterAll(async () => {
      const collections = mongoose.connection.collections
      const collection = collections['users']
      await collection.deleteMany({})
    })

    it('should respond with new access and refresh tokens', async () => {
      const res = await request(app)
        .post('/SASjsApi/auth/refresh')
        .auth(refreshToken, { type: 'bearer' })
        .send()
        .expect(200)

      expect(res.body).toHaveProperty('accessToken')
      expect(res.body).toHaveProperty('refreshToken')

      // cannot use same refresh again
      const resWithError = await request(app)
        .post('/SASjsApi/auth/refresh')
        .auth(refreshToken, { type: 'bearer' })
        .send()
        .expect(401)

      expect(resWithError.body).toEqual({})
    })
  })

  describe('logout', () => {
    let accessToken: string
    let currentUser: any

    beforeEach(async () => {
      currentUser = await userController.createUser(user)
      accessToken = generateAccessToken({
        clientId,
        userId: currentUser.id
      })

      await saveTokensInDB(
        currentUser.id,
        clientId,
        accessToken,
        'refreshToken'
      )
    })

    afterEach(async () => {
      const collections = mongoose.connection.collections
      const collection = collections['users']
      await collection.deleteMany({})
    })

    afterAll(async () => {
      const collections = mongoose.connection.collections
      const collection = collections['users']
      await collection.deleteMany({})
    })

    it('should respond no content and remove access/refresh tokens from DB', async () => {
      const res = await request(app)
        .delete('/SASjsApi/auth/logout')
        .auth(accessToken, { type: 'bearer' })
        .send()
        .expect(204)

      expect(res.body).toEqual({})

      expect(
        await verifyTokenInDB(
          currentUser.id,
          clientId,
          accessToken,
          'accessToken'
        )
      ).toBeUndefined()
    })
  })
})
