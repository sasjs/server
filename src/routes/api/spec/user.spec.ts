import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'
import app from '../../../app'
import { createUser } from '../../../controllers/createUser'
import { generateAccessToken } from '../auth'
import { saveTokensInDB } from '../../../utils'

const client = {
  clientid: 'someclientID',
  clientsecret: 'someclientSecret'
}
const adminUser = {
  displayname: 'Test Admin',
  username: 'testAdminUsername',
  password: '12345678',
  isadmin: true,
  isactive: true
}
const user = {
  displayname: 'Test User',
  username: 'testUsername',
  password: '87654321',
  isadmin: false,
  isactive: true
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
      client_id: client.clientid,
      username: adminUser.username
    })

    beforeEach(async () => {
      await createUser(adminUser)
      await saveTokensInDB(
        adminUser.username,
        client.clientid,
        adminAccessToken,
        'refreshToken'
      )
    })

    afterEach(async () => {
      const collections = mongoose.connection.collections
      const collection = collections['users']
      await collection.deleteMany({})
    })

    it('should respond with new user', async () => {
      const res = await request(app)
        .post('/SASjsApi/user')
        .auth(adminAccessToken, { type: 'bearer' })
        .send(user)
        .expect(200)

      expect(res.body.username).toEqual(user.username)
      expect(res.body.displayname).toEqual(user.displayname)
      expect(res.body.isadmin).toEqual(user.isadmin)
      expect(res.body.isactive).toEqual(user.isactive)
    })

    it('should respond with Unauthorized if access token is not present', async () => {
      const res = await request(app)
        .post('/SASjsApi/user')
        .send(user)
        .expect(401)

      expect(res.text).toEqual('Unauthorized')
      expect(res.body).toEqual({})
    })

    it('should respond with Forbideen if access token is not of an admin account', async () => {
      const accessToken = generateAccessToken({
        client_id: client.clientid,
        username: user.username
      })
      await createUser(user)
      await saveTokensInDB(
        user.username,
        client.clientid,
        accessToken,
        'refreshToken'
      )

      const res = await request(app)
        .post('/SASjsApi/user')
        .auth(accessToken, { type: 'bearer' })
        .send(user)
        .expect(403)

      expect(res.text).toEqual('Admin account required')
      expect(res.body).toEqual({})
    })

    it('should respond with Forbidden if username is already present', async () => {
      await createUser(user)

      const res = await request(app)
        .post('/SASjsApi/user')
        .auth(adminAccessToken, { type: 'bearer' })
        .send(user)
        .expect(403)

      expect(res.text).toEqual('Error: Username already exists.')
      expect(res.body).toEqual({})
    })

    it('should respond with Bad Request if username is missing', async () => {
      const res = await request(app)
        .post('/SASjsApi/user')
        .auth(adminAccessToken, { type: 'bearer' })
        .send({
          ...user,
          username: undefined
        })
        .expect(400)

      expect(res.text).toEqual(`"username" is required`)
      expect(res.body).toEqual({})
    })

    it('should respond with Bad Request if password is missing', async () => {
      const res = await request(app)
        .post('/SASjsApi/user')
        .auth(adminAccessToken, { type: 'bearer' })
        .send({
          ...user,
          password: undefined
        })
        .expect(400)

      expect(res.text).toEqual(`"password" is required`)
      expect(res.body).toEqual({})
    })

    it('should respond with Bad Request if displayname is missing', async () => {
      const res = await request(app)
        .post('/SASjsApi/user')
        .auth(adminAccessToken, { type: 'bearer' })
        .send({
          ...user,
          displayname: undefined
        })
        .expect(400)

      expect(res.text).toEqual(`"displayname" is required`)
      expect(res.body).toEqual({})
    })
  })
})
