import { Express } from 'express'
import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'
import appPromise from '../../../app'
import {
  UserController,
  ClientController,
  AuthController
} from '../../../controllers/'
import { InfoJWT } from '../../../types'
import {
  generateAccessToken,
  generateAuthCode,
  generateRefreshToken,
  randomBytesHexString,
  saveTokensInDB,
  verifyTokenInDB
} from '../../../utils'

const clientId = 'someclientID'
const clientSecret = 'someclientSecret'
const user = {
  displayName: 'Test User',
  username: 'testUsername',
  password: '87654321',
  isAdmin: false,
  isActive: true
}

describe('auth', () => {
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

  describe('token', () => {
    const userInfo: InfoJWT = {
      clientId,
      userId: randomBytesHexString(12)
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
      const code = AuthController.saveCode(
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
      const code = AuthController.saveCode(
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

    it('should respond with Unauthorized if code is invalid', async () => {
      const res = await request(app)
        .post('/SASjsApi/auth/token')
        .send({
          clientId,
          code: 'InvalidCode'
        })
        .expect(401)

      expect(res.text).toEqual('Invalid Auth Code')
    })

    it('should respond with Unauthorized when the code is valid but its client is gone', async () => {
      // The code names a client that has since been deleted: the exchange has
      // nothing to read its token lifetimes from, so it refuses with the same
      // status as a bad code rather than answering a pair with defaults.
      const issuedFor = 'someRemovedClient'
      const code = AuthController.saveCode(
        userInfo.userId,
        issuedFor,
        generateAuthCode({ clientId: issuedFor, userId: userInfo.userId })
      )

      const res = await request(app)
        .post('/SASjsApi/auth/token')
        .send({ clientId: issuedFor, code })
        .expect(401)

      expect(res.text).toEqual('Invalid clientId.')
    })

    it('should respond with Unauthorized if clientId is unknown', async () => {
      const code = AuthController.saveCode(
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
        .expect(401)

      expect(res.text).toEqual('Invalid Auth Code')
    })
  })

  describe('refresh', () => {
    let refreshToken: string
    let currentUser: any

    beforeEach(async () => {
      currentUser = await userController.createUser(user)
      refreshToken = generateRefreshToken({
        clientId,
        userId: currentUser.uid
      })
      await saveTokensInDB(
        currentUser.uid,
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
        userId: currentUser.uid
      })

      await saveTokensInDB(
        currentUser.uid,
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
        .post('/SASjsApi/auth/logout')
        .auth(accessToken, { type: 'bearer' })
        .send()
        .expect(204)

      expect(res.body).toEqual({})

      expect(
        await verifyTokenInDB(
          currentUser.uid,
          clientId,
          accessToken,
          'accessToken'
        )
      ).toBeUndefined()
    })
  })
})
