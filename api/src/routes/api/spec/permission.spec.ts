import { Express } from 'express'
import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'
import appPromise from '../../../app'
import {
  UserController,
  GroupController,
  ClientController
} from '../../../controllers/'
import { generateAccessToken, saveTokensInDB } from '../../../utils'

const clientId = 'someclientID'
const adminUser = {
  displayName: 'Test Admin',
  username: 'testAdminUsername',
  password: '12345678',
  isAdmin: true,
  isActive: true
}
const user = {
  displayName: 'Test User',
  username: 'testUsername',
  password: '87654321',
  isAdmin: false,
  isActive: true
}

const permission = {
  uri: '/SASjsApi/code/execute',
  setting: 'Grant',
  principalType: 'user',
  principalId: 123
}

const group = {
  name: 'DCGroup1',
  description: 'DC group for testing purposes.'
}

const userController = new UserController()
const groupController = new GroupController()
const clientController = new ClientController()

describe('permission', () => {
  let app: Express
  let con: Mongoose
  let mongoServer: MongoMemoryServer
  let adminAccessToken: string

  beforeAll(async () => {
    app = await appPromise

    mongoServer = await MongoMemoryServer.create()
    con = await mongoose.connect(mongoServer.getUri())

    adminAccessToken = await generateSaveTokenAndCreateUser()
  })

  afterAll(async () => {
    await con.connection.dropDatabase()
    await con.connection.close()
    await mongoServer.stop()
  })

  describe('create', () => {
    afterEach(async () => {
      await deleteAllPermissions()
    })

    it('should respond with new permission when principalType is user', async () => {
      const dbUser = await userController.createUser(user)
      permission.principalId = dbUser.id
      const res = await request(app)
        .post('/SASjsApi/permission')
        .auth(adminAccessToken, { type: 'bearer' })
        .send(permission)
        .expect(200)

      expect(res.body.permissionId).toBeTruthy()
      expect(res.body.uri).toEqual(permission.uri)
      expect(res.body.setting).toEqual(permission.setting)
      expect(res.body.user).toBeTruthy()
    })

    it('should respond with new permission when principalType is group', async () => {
      const dbGroup = await groupController.createGroup(group)

      const res = await request(app)
        .post('/SASjsApi/permission')
        .auth(adminAccessToken, { type: 'bearer' })
        .send({
          ...permission,
          principalType: 'group',
          principalId: dbGroup.groupId
        })
        .expect(200)

      expect(res.body.permissionId).toBeTruthy()
      expect(res.body.uri).toEqual(permission.uri)
      expect(res.body.setting).toEqual(permission.setting)
      expect(res.body.group).toBeTruthy()
    })

    it('should respond with new permission when principalType is client', async () => {
      const dbclient = await clientController.createClient({
        clientId: '123456789',
        clientSecret: '123456789'
      })

      const res = await request(app)
        .post('/SASjsApi/permission')
        .auth(adminAccessToken, { type: 'bearer' })
        .send({
          ...permission,
          principalType: 'client',
          principalId: dbclient.clientId
        })
        .expect(200)

      expect(res.body.permissionId).toBeTruthy()
      expect(res.body.uri).toEqual(permission.uri)
      expect(res.body.setting).toEqual(permission.setting)
      expect(res.body.clientId).toEqual(dbclient.clientId)
    })

    it('should respond with Unauthorized if access token is not present', async () => {
      const res = await request(app)
        .post('/SASjsApi/permission')
        .send(permission)
        .expect(401)

      expect(res.text).toEqual('Unauthorized')
      expect(res.body).toEqual({})
    })

    it('should respond with Unauthorized if access token is not of an admin account', async () => {
      const accessToken = await generateSaveTokenAndCreateUser({
        ...user,
        username: 'create' + user.username
      })

      const res = await request(app)
        .post('/SASjsApi/permission')
        .auth(accessToken, { type: 'bearer' })
        .send()
        .expect(401)

      expect(res.text).toEqual('Admin account required')
      expect(res.body).toEqual({})
    })

    it('should respond with Bad Request if uri is missing', async () => {
      const res = await request(app)
        .post('/SASjsApi/permission')
        .auth(adminAccessToken, { type: 'bearer' })
        .send({
          ...permission,
          uri: undefined
        })
        .expect(400)

      expect(res.text).toEqual(`"uri" is required`)
      expect(res.body).toEqual({})
    })

    it('should respond with Bad Request if setting is missing', async () => {
      const res = await request(app)
        .post('/SASjsApi/permission')
        .auth(adminAccessToken, { type: 'bearer' })
        .send({
          ...permission,
          setting: undefined
        })
        .expect(400)

      expect(res.text).toEqual(`"setting" is required`)
      expect(res.body).toEqual({})
    })

    it('should respond with Bad Request if principalType is missing', async () => {
      const res = await request(app)
        .post('/SASjsApi/permission')
        .auth(adminAccessToken, { type: 'bearer' })
        .send({
          ...permission,
          principalType: undefined
        })
        .expect(400)

      expect(res.text).toEqual(`"principalType" is required`)
      expect(res.body).toEqual({})
    })

    it('should respond with Bad Request if principalId is missing', async () => {
      const res = await request(app)
        .post('/SASjsApi/permission')
        .auth(adminAccessToken, { type: 'bearer' })
        .send({
          ...permission,
          principalId: undefined
        })
        .expect(400)

      expect(res.text).toEqual(`"principalId" is required`)
      expect(res.body).toEqual({})
    })

    it('should respond with forbidden Request (403) if user is not found', async () => {
      const res = await request(app)
        .post('/SASjsApi/permission')
        .auth(adminAccessToken, { type: 'bearer' })
        .send({
          ...permission,
          principalId: 123
        })
        .expect(403)

      expect(res.text).toEqual('Error: User not found.')
      expect(res.body).toEqual({})
    })

    it('should respond with forbidden Request (403) if group is not found', async () => {
      const res = await request(app)
        .post('/SASjsApi/permission')
        .auth(adminAccessToken, { type: 'bearer' })
        .send({
          ...permission,
          principalType: 'group'
        })
        .expect(403)

      expect(res.text).toEqual('Error: Group not found.')
      expect(res.body).toEqual({})
    })

    it('should respond with forbidden Request (403) if client is not found', async () => {
      const res = await request(app)
        .post('/SASjsApi/permission')
        .auth(adminAccessToken, { type: 'bearer' })
        .send({
          ...permission,
          principalType: 'client'
        })
        .expect(403)

      expect(res.text).toEqual('Error: Client not found.')
      expect(res.body).toEqual({})
    })
  })
})

const generateSaveTokenAndCreateUser = async (
  someUser?: any
): Promise<string> => {
  const dbUser = await userController.createUser(someUser ?? adminUser)

  return generateAndSaveToken(dbUser.id)
}

const generateAndSaveToken = async (userId: number) => {
  const adminAccessToken = generateAccessToken({
    clientId,
    userId
  })
  await saveTokensInDB(userId, clientId, adminAccessToken, 'refreshToken')
  return adminAccessToken
}

const deleteAllPermissions = async () => {
  const { collections } = mongoose.connection
  const collection = collections['permissions']
  await collection.deleteMany({})
}
