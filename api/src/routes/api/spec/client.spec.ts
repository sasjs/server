import { Express } from 'express'
import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'
import appPromise from '../../../app'
import { UserController, ClientController } from '../../../controllers/'
import { generateAccessToken, saveTokensInDB } from '../../../utils'
import { NUMBER_OF_SECONDS_IN_A_DAY } from '../../../model/Client'

const client = {
  clientId: 'someclientID',
  clientSecret: 'someclientSecret'
}
const adminUser = {
  displayName: 'Test Admin',
  username: 'testAdminUsername',
  password: '12345678',
  isAdmin: true,
  isActive: true
}
const newClient = {
  clientId: 'newClientID',
  clientSecret: 'newClientSecret'
}

describe('client', () => {
  let app: Express
  let con: Mongoose
  let mongoServer: MongoMemoryServer
  let adminAccessToken: string
  const userController = new UserController()
  const clientController = new ClientController()

  beforeAll(async () => {
    app = await appPromise

    mongoServer = await MongoMemoryServer.create()
    con = await mongoose.connect(mongoServer.getUri())

    const dbUser = await userController.createUser(adminUser)
    adminAccessToken = generateAccessToken({
      clientId: client.clientId,
      userId: dbUser.id
    })
    await saveTokensInDB(
      dbUser.id,
      client.clientId,
      adminAccessToken,
      'refreshToken'
    )
  })

  afterAll(async () => {
    await con.connection.dropDatabase()
    await con.connection.close()
    await mongoServer.stop()
  })

  describe('create', () => {
    afterEach(async () => {
      const collections = mongoose.connection.collections
      const collection = collections['clients']
      await collection.deleteMany({})
    })

    it('should respond with new client', async () => {
      const res = await request(app)
        .post('/SASjsApi/client')
        .auth(adminAccessToken, { type: 'bearer' })
        .send(newClient)
        .expect(200)

      expect(res.body.clientId).toEqual(newClient.clientId)
      expect(res.body.clientSecret).toEqual(newClient.clientSecret)
    })

    it('should respond with Unauthorized if access token is not present', async () => {
      const res = await request(app)
        .post('/SASjsApi/client')
        .send(newClient)
        .expect(401)

      expect(res.text).toEqual('Unauthorized')
      expect(res.body).toEqual({})
    })

    it('should respond with Forbideen if access token is not of an admin account', async () => {
      const user = {
        displayName: 'User 1',
        username: 'username1',
        password: '12345678',
        isAdmin: false,
        isActive: true
      }
      const dbUser = await userController.createUser(user)
      const accessToken = generateAccessToken({
        clientId: client.clientId,
        userId: dbUser.id
      })
      await saveTokensInDB(
        dbUser.id,
        client.clientId,
        accessToken,
        'refreshToken'
      )

      const res = await request(app)
        .post('/SASjsApi/client')
        .auth(accessToken, { type: 'bearer' })
        .send(newClient)
        .expect(401)

      expect(res.text).toEqual('Admin account required')
      expect(res.body).toEqual({})
    })

    it('should respond with Forbidden if clientId is already present', async () => {
      await clientController.createClient(newClient)

      const res = await request(app)
        .post('/SASjsApi/client')
        .auth(adminAccessToken, { type: 'bearer' })
        .send(newClient)
        .expect(403)

      expect(res.text).toEqual('Error: Client ID already exists.')
      expect(res.body).toEqual({})
    })

    it('should respond with Bad Request if clientId is missing', async () => {
      const res = await request(app)
        .post('/SASjsApi/client')
        .auth(adminAccessToken, { type: 'bearer' })
        .send({
          ...newClient,
          clientId: undefined
        })
        .expect(400)

      expect(res.text).toEqual(`"clientId" is required`)
      expect(res.body).toEqual({})
    })

    it('should respond with Bad Request if clientSecret is missing', async () => {
      const res = await request(app)
        .post('/SASjsApi/client')
        .auth(adminAccessToken, { type: 'bearer' })
        .send({
          ...newClient,
          clientSecret: undefined
        })
        .expect(400)

      expect(res.text).toEqual(`"clientSecret" is required`)
      expect(res.body).toEqual({})
    })
  })

  describe('get', () => {
    afterEach(async () => {
      const collections = mongoose.connection.collections
      const collection = collections['clients']
      await collection.deleteMany({})
    })

    it('should respond with an array of all clients', async () => {
      await clientController.createClient(newClient)
      await clientController.createClient({
        clientId: 'clientID',
        clientSecret: 'clientSecret'
      })

      const res = await request(app)
        .get('/SASjsApi/client')
        .auth(adminAccessToken, { type: 'bearer' })
        .send()
        .expect(200)

      const expected = [
        {
          clientId: 'newClientID',
          clientSecret: 'newClientSecret',
          accessTokenExpiration: NUMBER_OF_SECONDS_IN_A_DAY,
          refreshTokenExpiration: NUMBER_OF_SECONDS_IN_A_DAY * 30
        },
        {
          clientId: 'clientID',
          clientSecret: 'clientSecret',
          accessTokenExpiration: NUMBER_OF_SECONDS_IN_A_DAY,
          refreshTokenExpiration: NUMBER_OF_SECONDS_IN_A_DAY * 30
        }
      ]

      expect(res.body).toEqual(expected)
    })

    it('should respond with Unauthorized if access token is not present', async () => {
      const res = await request(app).get('/SASjsApi/client').send().expect(401)

      expect(res.text).toEqual('Unauthorized')
      expect(res.body).toEqual({})
    })

    it('should respond with Forbideen if access token is not of an admin account', async () => {
      const user = {
        displayName: 'User 2',
        username: 'username2',
        password: '12345678',
        isAdmin: false,
        isActive: true
      }
      const dbUser = await userController.createUser(user)
      const accessToken = generateAccessToken({
        clientId: client.clientId,
        userId: dbUser.id
      })
      await saveTokensInDB(
        dbUser.id,
        client.clientId,
        accessToken,
        'refreshToken'
      )

      const res = await request(app)
        .get('/SASjsApi/client')
        .auth(accessToken, { type: 'bearer' })
        .send()
        .expect(401)

      expect(res.text).toEqual('Admin account required')
      expect(res.body).toEqual({})
    })
  })
})
