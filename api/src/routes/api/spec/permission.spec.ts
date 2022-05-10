import { Express } from 'express'
import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'
import appPromise from '../../../app'
import {
  UserController,
  GroupController,
  ClientController,
  PermissionController
} from '../../../controllers/'
import {
  UserDetailsResponse,
  PermissionDetailsResponse
} from '../../../controllers'
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
const permissionController = new PermissionController()

describe('permission', () => {
  let app: Express
  let con: Mongoose
  let mongoServer: MongoMemoryServer
  let adminAccessToken: string
  let dbUser: UserDetailsResponse | undefined

  beforeAll(async () => {
    app = await appPromise

    mongoServer = await MongoMemoryServer.create()
    con = await mongoose.connect(mongoServer.getUri())

    adminAccessToken = await generateSaveTokenAndCreateUser()
    dbUser = await userController.createUser(user)
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
      const res = await request(app)
        .post('/SASjsApi/permission')
        .auth(adminAccessToken, { type: 'bearer' })
        .send({ ...permission, principalId: dbUser?.id })
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

    it('should respond with forbidden Request (403) if principal type is not valid', async () => {
      const res = await request(app)
        .post('/SASjsApi/permission')
        .auth(adminAccessToken, { type: 'bearer' })
        .send({
          ...permission,
          principalType: 'invalid'
        })
        .expect(403)

      expect(res.text).toEqual(
        'Error: Invalid principal type. Valid types are user, group and client.'
      )
      expect(res.body).toEqual({})
    })
  })

  describe('update', () => {
    let dbPermission: PermissionDetailsResponse | undefined
    beforeAll(async () => {
      dbPermission = await permissionController.createPermission({
        ...permission,
        principalId: dbUser?.id
      })
    })

    afterEach(async () => {
      await deleteAllPermissions()
    })

    it('should respond with updated permission', async () => {
      const res = await request(app)
        .patch(`/SASjsApi/permission/${dbPermission?.permissionId}`)
        .auth(adminAccessToken, { type: 'bearer' })
        .send({ setting: 'Deny' })
        .expect(200)

      expect(res.body.setting).toEqual('Deny')
    })

    it('should respond with Unauthorized if access token is not present', async () => {
      const res = await request(app)
        .patch(`/SASjsApi/permission/${dbPermission?.permissionId}`)
        .send(permission)
        .expect(401)

      expect(res.text).toEqual('Unauthorized')
      expect(res.body).toEqual({})
    })

    it('should respond with Unauthorized if access token is not of an admin account', async () => {
      const accessToken = await generateSaveTokenAndCreateUser({
        ...user,
        username: 'update' + user.username
      })

      const res = await request(app)
        .patch(`/SASjsApi/permission/${dbPermission?.permissionId}`)
        .auth(accessToken, { type: 'bearer' })
        .send()
        .expect(401)

      expect(res.text).toEqual('Admin account required')
      expect(res.body).toEqual({})
    })

    it('should respond with Bad Request if setting is missing', async () => {
      const res = await request(app)
        .patch(`/SASjsApi/permission/${dbPermission?.permissionId}`)
        .auth(adminAccessToken, { type: 'bearer' })
        .send()
        .expect(400)

      expect(res.text).toEqual(`"setting" is required`)
      expect(res.body).toEqual({})
    })

    it('should respond with forbidden Request (403) if permission with provided id does not exists', async () => {
      const res = await request(app)
        .patch('/SASjsApi/permission/123')
        .auth(adminAccessToken, { type: 'bearer' })
        .send({
          setting: 'deny'
        })
        .expect(403)

      expect(res.text).toEqual('Error: Unable to update permission')
      expect(res.body).toEqual({})
    })
  })

  describe('delete', () => {
    it('should delete permission', async () => {
      const dbPermission = await permissionController.createPermission({
        ...permission,
        principalId: dbUser?.id
      })
      const res = await request(app)
        .delete(`/SASjsApi/permission/${dbPermission?.permissionId}`)
        .auth(adminAccessToken, { type: 'bearer' })
        .send()
        .expect(200)

      expect(res.text).toEqual('Permission Deleted!')
    })

    it('should respond with forbidden Request (403) if permission with provided id does not exists', async () => {
      const res = await request(app)
        .delete('/SASjsApi/permission/123')
        .auth(adminAccessToken, { type: 'bearer' })
        .send()
        .expect(403)

      expect(res.text).toEqual('Error: Permission is not found.')
    })
  })

  describe('get', () => {
    beforeAll(async () => {
      await permissionController.createPermission({
        ...permission,
        uri: '/test-1',
        principalId: dbUser?.id
      })
      await permissionController.createPermission({
        ...permission,
        uri: '/test-2',
        principalId: dbUser?.id
      })
    })

    it('should give a list of all permissions when user is admin', async () => {
      const res = await request(app)
        .get('/SASjsApi/permission/')
        .auth(adminAccessToken, { type: 'bearer' })
        .send()
        .expect(200)

      expect(res.body).toHaveLength(2)
    })

    it('should give a list of all permissions when user is not admin', async () => {
      const accessToken = await generateSaveTokenAndCreateUser({
        ...user,
        username: 'get' + user.username
      })
      const res = await request(app)
        .get('/SASjsApi/permission/')
        .auth(accessToken, { type: 'bearer' })
        .send()
        .expect(200)

      expect(res.body).toHaveLength(2)
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
