import { Express } from 'express'
import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'
import appPromise from '../../../app'
import { UserController } from '../../../controllers/'
import { generateAccessToken, saveTokensInDB } from '../../../utils/'

const clientId = 'someclientID'

describe('Info', () => {
  let app: Express
  let con: Mongoose
  let mongoServer: MongoMemoryServer
  const controller = new UserController()

  const admin = {
    displayName: 'Test Admin',
    username: 'adminUsername',
    password: 'adminPassword',
    isAdmin: true,
    isActive: true
  }

  const nonAdmin = {
    displayName: 'Test User',
    username: 'plainUsername',
    password: 'userPassword',
    isAdmin: false,
    isActive: true
  }

  const generateAndSaveToken = async (userId: string) => {
    const token = generateAccessToken({ clientId, userId })
    await saveTokensInDB(userId, clientId, token, 'refreshToken')
    return token
  }

  beforeAll(async () => {
    app = await appPromise

    mongoServer = await MongoMemoryServer.create()
    con = await mongoose.connect(mongoServer.getUri())

    await controller.createUser(admin)
    await controller.createUser(nonAdmin)
  })

  afterAll(async () => {
    await con.connection.dropDatabase()
    await con.connection.close()
    await mongoServer.stop()
  })

  describe('GET /SASjsApi/info', () => {
    it('should return configured information of the server instance', async () => {
      const res = await request(app).get('/SASjsApi/info').expect(200)

      expect(res.body.mode).toEqual('server')
      expect(res.body.cors).toEqual('disable')
      expect(res.body.protocol).toEqual('http')
    })

    it('should not disclose the CORS whitelist', async () => {
      const res = await request(app).get('/SASjsApi/info').expect(200)

      expect(res.body.whiteList).toBeUndefined()
      expect(res.text).not.toContain('example.com')
    })
  })

  describe('GET /SASjsApi/info/authorizedRoutes', () => {
    it('should respond with Unauthorized when access token is not present', async () => {
      const res = await request(app)
        .get('/SASjsApi/info/authorizedRoutes')
        .expect(401)

      expect(res.text).toEqual('Unauthorized')
    })

    it('should respond with Unauthorized for a non-admin user', async () => {
      const user = await controller.getUserByUsername(
        { user: { isAdmin: false } } as any,
        nonAdmin.username
      )
      const token = await generateAndSaveToken(user.uid)

      await request(app)
        .get('/SASjsApi/info/authorizedRoutes')
        .auth(token, { type: 'bearer' })
        .expect(401)
    })

    it('should return the route inventory for an admin', async () => {
      const user = await controller.getUserByUsername(
        { user: { isAdmin: true } } as any,
        admin.username
      )
      const token = await generateAndSaveToken(user.uid)

      const res = await request(app)
        .get('/SASjsApi/info/authorizedRoutes')
        .auth(token, { type: 'bearer' })
        .expect(200)

      expect(res.body.paths).toContain('/SASjsApi/stp/execute')
    })
  })
})
