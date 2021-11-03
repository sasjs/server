import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'
import app from '../../../app'
import { createClient } from '../../../controllers/createClient'
import { generateAccessToken } from '../auth'
import { createUser } from '../../../controllers/createUser'
import { saveTokensInDB } from '../../../utils'

const client = {
  client_id: 'someclientID',
  client_secret: 'someclientSecret'
}
const adminUser = {
  displayname: 'Test Admin',
  username: 'testAdminUsername',
  password: '12345678',
  isadmin: true,
  isactive: true
}
const newClient = {
  client_id: 'newClientID',
  client_secret: 'newClientSecret'
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
      client_id: client.client_id,
      username: adminUser.username
    })

    beforeAll(async () => {
      await createUser(adminUser)
      await saveTokensInDB(
        adminUser.username,
        client.client_id,
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

      expect(res.body.client_id).toEqual(newClient.client_id)
      expect(res.body.client_secret).toEqual(newClient.client_secret)
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
        displayname: 'User 1',
        username: 'username1',
        password: '12345678',
        isadmin: false,
        isactive: true
      }
      const accessToken = generateAccessToken({
        client_id: client.client_id,
        username: user.username
      })
      await createUser(user)
      await saveTokensInDB(
        user.username,
        client.client_id,
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

    it('should respond with Forbidden if client_id is already present', async () => {
      await createClient(newClient)

      const res = await request(app)
        .post('/SASjsApi/client')
        .auth(adminAccessToken, { type: 'bearer' })
        .send(newClient)
        .expect(403)

      expect(res.text).toEqual('Error: Client ID already exists.')
      expect(res.body).toEqual({})
    })

    it('should respond with Bad Request if client_id is missing', async () => {
      const res = await request(app)
        .post('/SASjsApi/client')
        .auth(adminAccessToken, { type: 'bearer' })
        .send({
          ...newClient,
          client_id: undefined
        })
        .expect(400)

      expect(res.text).toEqual(`"client_id" is required`)
      expect(res.body).toEqual({})
    })

    it('should respond with Bad Request if client_secret is missing', async () => {
      const res = await request(app)
        .post('/SASjsApi/client')
        .auth(adminAccessToken, { type: 'bearer' })
        .send({
          ...newClient,
          client_secret: undefined
        })
        .expect(400)

      expect(res.text).toEqual(`"client_secret" is required`)
      expect(res.body).toEqual({})
    })
  })
})
