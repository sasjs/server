import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'
import app from '../../../app'
import { createClient } from '../../../controllers/createClient'
import { generateAccessToken } from '../auth'

const client = {
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
      client_id: 'someClientID',
      username: 'someAdminUsername',
      isadmin: true,
      isactive: true
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
        .send(client)
        .expect(200)

      expect(res.body.client_id).toEqual(client.client_id)
      expect(res.body.client_secret).toEqual(client.client_secret)
    })

    it('should respond with Unauthorized if access token is not present', async () => {
      const res = await request(app)
        .post('/SASjsApi/client')
        .send(client)
        .expect(401)

      expect(res.text).toEqual('Unauthorized')
      expect(res.body).toEqual({})
    })

    it('should respond with Forbideen if access token is not of an admin account', async () => {
      const accessToken = generateAccessToken({
        client_id: 'someClientID',
        username: 'someUsername',
        isadmin: false,
        isactive: true
      })

      const res = await request(app)
        .post('/SASjsApi/client')
        .auth(accessToken, { type: 'bearer' })
        .send(client)
        .expect(403)

      expect(res.text).toEqual('Admin account required')
      expect(res.body).toEqual({})
    })

    it('should respond with Forbidden if client_id is already present', async () => {
      await createClient(client)

      const res = await request(app)
        .post('/SASjsApi/client')
        .auth(adminAccessToken, { type: 'bearer' })
        .send(client)
        .expect(403)

      expect(res.text).toEqual('Error: Client ID already exists.')
      expect(res.body).toEqual({})
    })

    it('should respond with Bad Request if client_id is missing', async () => {
      const res = await request(app)
        .post('/SASjsApi/client')
        .auth(adminAccessToken, { type: 'bearer' })
        .send({
          ...client,
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
          ...client,
          client_secret: undefined
        })
        .expect(400)

      expect(res.text).toEqual(`"client_secret" is required`)
      expect(res.body).toEqual({})
    })
  })
})
