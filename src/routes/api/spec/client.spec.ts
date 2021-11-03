import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'
import app from '../../../app'
import { createClient } from '../../../controllers/createClient'
import { generateAccessToken } from '../auth'
import { createUser } from '../../../controllers/createUser'
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

describe('user', () => {
  let con: Mongoose
  let mongoServer: MongoMemoryServer

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
    const adminAccessToken = generateAccessToken({
      clientId: client.clientId,
      username: adminUser.username
    })

    beforeAll(async () => {
      await createUser(adminUser)
      await saveTokensInDB(
        adminUser.username,
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
      const accessToken = generateAccessToken({
        clientId: client.clientId,
        username: user.username
      })
      await createUser(user)
      await saveTokensInDB(
        user.username,
        client.clientId,
        accessToken,
        'refreshToken'
      )

      const res = await request(app)
        .post('/SASjsApi/client')
        .auth(accessToken, { type: 'bearer' })
        .send(newClient)
        .expect(403)

      expect(res.text).toEqual('Admin account required')
      expect(res.body).toEqual({})
    })

    it('should respond with Forbidden if clientId is already present', async () => {
      await createClient(newClient)

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
