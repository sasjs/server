import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'
import app from '../../../app'
import UserController from '../../../controllers/user'
import ClientController from '../../../controllers/client'
import { generateAccessToken } from '../../../controllers/auth'
import { saveTokensInDB } from '../../../utils'

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
  let con: Mongoose
  let mongoServer: MongoMemoryServer
  const userController = new UserController()
  const clientController = new ClientController()

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create()
    con = await mongoose.connect(mongoServer.getUri())
  })

  afterAll(async () => {
    await con.connection.dropDatabase()
    await con.connection.close()
    await mongoServer.stop()
  })

  describe('create', () => {
    let adminAccessToken: string
    let dbUser: any

    beforeAll(async () => {
      dbUser = await userController.createUser(adminUser)
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
})
