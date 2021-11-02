import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'
import app from '../../../app'
import { createUser } from '../../../controllers/createUser'
import { createClient } from '../../../controllers/createClient'
import { generateAuthCode, populateClients, saveCode } from '../auth'
import { InfoJWT } from '../../../types'

const client = {
  client_id: 'someclientID',
  client_secret: 'someclientSecret'
}
const user = {
  displayname: 'Test User',
  username: 'testUsername',
  password: '87654321',
  isadmin: false,
  isactive: true
}

describe('auth', () => {
  let con: Mongoose
  let mongoServer: MongoMemoryServer

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create()
    con = await mongoose.connect(mongoServer.getUri())
    await createClient(client)
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
      await createUser(user)

      const res = await request(app)
        .post('/SASjsApi/auth/authorize')
        .send({
          username: user.username,
          password: user.password,
          client_id: client.client_id
        })
        .expect(200)

      expect(res.body).toHaveProperty('code')
    })

    it('should respond with Bad Request if username is missing', async () => {
      const res = await request(app)
        .post('/SASjsApi/auth/authorize')
        .send({
          password: user.password,
          client_id: client.client_id
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
          client_id: client.client_id
        })
        .expect(400)

      expect(res.text).toEqual(`"password" is required`)
      expect(res.body).toEqual({})
    })

    it('should respond with Bad Request if client_id is missing', async () => {
      const res = await request(app)
        .post('/SASjsApi/auth/authorize')
        .send({
          username: user.username,
          password: user.password
        })
        .expect(400)

      expect(res.text).toEqual(`"client_id" is required`)
      expect(res.body).toEqual({})
    })

    it('should respond with Forbidden if username is incorrect', async () => {
      const res = await request(app)
        .post('/SASjsApi/auth/authorize')
        .send({
          username: user.username,
          password: user.password,
          client_id: client.client_id
        })
        .expect(403)

      expect(res.text).toEqual('Username is not found.')
      expect(res.body).toEqual({})
    })

    it('should respond with Forbidden if password is incorrect', async () => {
      await createUser(user)

      const res = await request(app)
        .post('/SASjsApi/auth/authorize')
        .send({
          username: user.username,
          password: 'WrongPassword',
          client_id: client.client_id
        })
        .expect(403)

      expect(res.text).toEqual('Invalid password.')
      expect(res.body).toEqual({})
    })

    it('should respond with Forbidden if client_id is incorrect', async () => {
      await createUser(user)

      const res = await request(app)
        .post('/SASjsApi/auth/authorize')
        .send({
          username: user.username,
          password: user.password,
          client_id: 'WrongClientID'
        })
        .expect(403)

      expect(res.text).toEqual('Invalid client_id.')
      expect(res.body).toEqual({})
    })
  })

  describe('token', () => {
    const userInfo: InfoJWT = {
      client_id: client.client_id,
      username: user.username,
      isadmin: user.isadmin,
      isactive: user.isactive
    }
    beforeAll(async () => {
      await createUser(user)
    })
    afterAll(async () => {
      const collections = mongoose.connection.collections
      const collection = collections['users']
      await collection.deleteMany({})
    })

    it('should respond with access and refresh tokens', async () => {
      const code = saveCode(userInfo.client_id, generateAuthCode(userInfo))

      const res = await request(app)
        .post('/SASjsApi/auth/token')
        .send({
          client_id: client.client_id,
          client_secret: client.client_secret,
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
          client_id: client.client_id,
          client_secret: client.client_secret
        })
        .expect(400)

      expect(res.text).toEqual(`"code" is required`)
      expect(res.body).toEqual({})
    })

    it('should respond with Bad Request if client_id is missing', async () => {
      const code = saveCode(userInfo.client_id, generateAuthCode(userInfo))

      const res = await request(app)
        .post('/SASjsApi/auth/token')
        .send({
          client_secret: client.client_secret,
          code
        })
        .expect(400)

      expect(res.text).toEqual(`"client_id" is required`)
      expect(res.body).toEqual({})
    })

    it('should respond with Bad Request if client_secret is missing', async () => {
      const code = saveCode(userInfo.client_id, generateAuthCode(userInfo))

      const res = await request(app)
        .post('/SASjsApi/auth/token')
        .send({
          client_id: client.client_id,
          code
        })
        .expect(400)

      expect(res.text).toEqual(`"client_secret" is required`)
      expect(res.body).toEqual({})
    })

    it('should respond with Forbidden if code is invalid', async () => {
      const res = await request(app)
        .post('/SASjsApi/auth/token')
        .send({
          client_id: client.client_id,
          client_secret: client.client_secret,
          code: 'InvalidCode'
        })
        .expect(403)

      expect(res.body).toEqual({})
    })

    it('should respond with Forbidden if client_id is invalid', async () => {
      const code = saveCode(userInfo.client_id, generateAuthCode(userInfo))

      const res = await request(app)
        .post('/SASjsApi/auth/token')
        .send({
          client_id: 'WrongClientID',
          client_secret: client.client_secret,
          code
        })
        .expect(403)

      expect(res.body).toEqual({})
    })

    it('should respond with Forbidden if client_secret is invalid', async () => {
      const code = saveCode(userInfo.client_id, generateAuthCode(userInfo))

      const res = await request(app)
        .post('/SASjsApi/auth/token')
        .send({
          client_id: client.client_id,
          client_secret: 'WrongClientSecret',
          code
        })
        .expect(403)

      expect(res.body).toEqual({})
    })
  })
})
