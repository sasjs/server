import { Express } from 'express'
import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'
import appPromise from '../../../app'
import {
  DriveController,
  UserController,
  GroupController,
  PermissionController,
  PrincipalType,
  PermissionType,
  PermissionSettingForRoute
} from '../../../controllers/'
import {
  UserDetailsResponse,
  PermissionDetailsResponse
} from '../../../controllers'
import { generateAccessToken, saveTokensInDB } from '../../../utils'

const deployPayload = {
  appLoc: 'string',
  streamWebFolder: 'string',
  fileTree: {
    members: [
      {
        name: 'string',
        type: 'folder',
        members: [
          'string',
          {
            name: 'string',
            type: 'service',
            code: 'string'
          }
        ]
      }
    ]
  }
}

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
  path: '/SASjsApi/code/execute',
  type: PermissionType.route,
  setting: PermissionSettingForRoute.grant,
  principalType: PrincipalType.user
}

const group = {
  name: 'DCGroup1',
  description: 'DC group for testing purposes.'
}

const userController = new UserController()
const groupController = new GroupController()
const permissionController = new PermissionController()

describe('permission', () => {
  let app: Express
  let con: Mongoose
  let mongoServer: MongoMemoryServer
  let adminAccessToken: string
  let dbUser: UserDetailsResponse

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
        .send({ ...permission, principalId: dbUser.id })
        .expect(200)

      expect(res.body.permissionId).toBeTruthy()
      expect(res.body.path).toEqual(permission.path)
      expect(res.body.type).toEqual(permission.type)
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
      expect(res.body.path).toEqual(permission.path)
      expect(res.body.type).toEqual(permission.type)
      expect(res.body.setting).toEqual(permission.setting)
      expect(res.body.group).toBeTruthy()
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
      const accessToken = await generateAndSaveToken(dbUser.id)

      const res = await request(app)
        .post('/SASjsApi/permission')
        .auth(accessToken, { type: 'bearer' })
        .send(permission)
        .expect(401)

      expect(res.text).toEqual('Admin account required')
      expect(res.body).toEqual({})
    })

    it('should respond with Bad Request if path is missing', async () => {
      const res = await request(app)
        .post('/SASjsApi/permission')
        .auth(adminAccessToken, { type: 'bearer' })
        .send({
          ...permission,
          path: undefined
        })
        .expect(400)

      expect(res.text).toEqual(`"path" is required`)
      expect(res.body).toEqual({})
    })

    it('should respond with Bad Request if path is not valid', async () => {
      const res = await request(app)
        .post('/SASjsApi/permission')
        .auth(adminAccessToken, { type: 'bearer' })
        .send({
          ...permission,
          path: '/some/random/api/endpoint'
        })
        .expect(400)

      expect(res.body).toEqual({})
    })

    it('should respond with Bad Request if type is not valid', async () => {
      const res = await request(app)
        .post('/SASjsApi/permission')
        .auth(adminAccessToken, { type: 'bearer' })
        .send({
          ...permission,
          type: 'invalid'
        })
        .expect(400)

      expect(res.text).toEqual('"type" must be [Route]')
      expect(res.body).toEqual({})
    })

    it('should respond with Bad Request if type is missing', async () => {
      const res = await request(app)
        .post('/SASjsApi/permission')
        .auth(adminAccessToken, { type: 'bearer' })
        .send({
          ...permission,
          type: undefined
        })
        .expect(400)

      expect(res.text).toEqual(`"type" is required`)
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

    it('should respond with Bad Request if setting is not valid', async () => {
      const res = await request(app)
        .post('/SASjsApi/permission')
        .auth(adminAccessToken, { type: 'bearer' })
        .send({
          ...permission,
          setting: 'invalid'
        })
        .expect(400)

      expect(res.text).toEqual('"setting" must be one of [Grant, Deny]')
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

    it('should respond with Bad Request if principal type is not valid', async () => {
      const res = await request(app)
        .post('/SASjsApi/permission')
        .auth(adminAccessToken, { type: 'bearer' })
        .send({
          ...permission,
          principalType: 'invalid'
        })
        .expect(400)

      expect(res.text).toEqual('"principalType" must be one of [user, group]')
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

    it('should respond with Bad Request if principalId is not a number', async () => {
      const res = await request(app)
        .post('/SASjsApi/permission')
        .auth(adminAccessToken, { type: 'bearer' })
        .send({
          ...permission,
          principalId: 'someCharacters'
        })
        .expect(400)

      expect(res.text).toEqual('"principalId" must be a number')
      expect(res.body).toEqual({})
    })

    it('should respond with Bad Request if adding permission for admin user', async () => {
      const adminUser = await userController.createUser({
        ...user,
        username: 'adminUser',
        isAdmin: true
      })

      const res = await request(app)
        .post('/SASjsApi/permission')
        .auth(adminAccessToken, { type: 'bearer' })
        .send({
          ...permission,
          principalId: adminUser.id
        })
        .expect(400)

      expect(res.text).toEqual('Can not add permission for admin user.')
      expect(res.body).toEqual({})
    })

    it('should respond with Not Found (404) if user is not found', async () => {
      const res = await request(app)
        .post('/SASjsApi/permission')
        .auth(adminAccessToken, { type: 'bearer' })
        .send({
          ...permission,
          principalId: 123
        })
        .expect(404)

      expect(res.text).toEqual('User not found.')
      expect(res.body).toEqual({})
    })

    it('should respond with Not Found (404) if group is not found', async () => {
      const res = await request(app)
        .post('/SASjsApi/permission')
        .auth(adminAccessToken, { type: 'bearer' })
        .send({
          ...permission,
          principalType: 'group',
          principalId: 123
        })
        .expect(404)

      expect(res.text).toEqual('Group not found.')
      expect(res.body).toEqual({})
    })

    it('should respond with Conflict (409) if permission already exists', async () => {
      await permissionController.createPermission({
        ...permission,
        principalId: dbUser.id
      })

      const res = await request(app)
        .post('/SASjsApi/permission')
        .auth(adminAccessToken, { type: 'bearer' })
        .send({ ...permission, principalId: dbUser.id })
        .expect(409)

      expect(res.text).toEqual(
        'Permission already exists with provided Path, Type and User.'
      )
      expect(res.body).toEqual({})
    })
  })

  describe('update', () => {
    let dbPermission: PermissionDetailsResponse | undefined
    beforeAll(async () => {
      dbPermission = await permissionController.createPermission({
        ...permission,
        principalId: dbUser.id
      })
    })

    afterEach(async () => {
      await deleteAllPermissions()
    })

    it('should respond with updated permission', async () => {
      const res = await request(app)
        .patch(`/SASjsApi/permission/${dbPermission?.permissionId}`)
        .auth(adminAccessToken, { type: 'bearer' })
        .send({ setting: PermissionSettingForRoute.deny })
        .expect(200)

      expect(res.body.setting).toEqual('Deny')
    })

    it('should respond with Unauthorized if access token is not present', async () => {
      const res = await request(app)
        .patch(`/SASjsApi/permission/${dbPermission?.permissionId}`)
        .send()
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

    it('should respond with Bad Request if setting is  invalid', async () => {
      const res = await request(app)
        .patch(`/SASjsApi/permission/${dbPermission?.permissionId}`)
        .auth(adminAccessToken, { type: 'bearer' })
        .send({
          setting: 'invalid'
        })
        .expect(400)

      expect(res.text).toEqual('"setting" must be one of [Grant, Deny]')
      expect(res.body).toEqual({})
    })

    it('should respond with not found (404) if permission with provided id does not exist', async () => {
      const res = await request(app)
        .patch('/SASjsApi/permission/123')
        .auth(adminAccessToken, { type: 'bearer' })
        .send({
          setting: PermissionSettingForRoute.deny
        })
        .expect(404)

      expect(res.text).toEqual('Permission not found.')
      expect(res.body).toEqual({})
    })
  })

  describe('delete', () => {
    it('should delete permission', async () => {
      const dbPermission = await permissionController.createPermission({
        ...permission,
        principalId: dbUser.id
      })
      const res = await request(app)
        .delete(`/SASjsApi/permission/${dbPermission?.permissionId}`)
        .auth(adminAccessToken, { type: 'bearer' })
        .send()
        .expect(200)

      expect(res.text).toEqual('Permission Deleted!')
    })

    it('should respond with not found (404) if permission with provided id does not exists', async () => {
      const res = await request(app)
        .delete('/SASjsApi/permission/123')
        .auth(adminAccessToken, { type: 'bearer' })
        .send()
        .expect(404)

      expect(res.text).toEqual('Permission not found.')
    })
  })

  describe('get', () => {
    beforeAll(async () => {
      await permissionController.createPermission({
        ...permission,
        path: '/test-1',
        principalId: dbUser.id
      })
      await permissionController.createPermission({
        ...permission,
        path: '/test-2',
        principalId: dbUser.id
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

    it(`should give a list of user's own  permissions when user is not admin`, async () => {
      const nonAdminUser = await userController.createUser({
        ...user,
        username: 'get' + user.username
      })
      const accessToken = await generateAndSaveToken(nonAdminUser.id)
      await permissionController.createPermission({
        path: '/test-1',
        type: PermissionType.route,
        principalType: PrincipalType.user,
        principalId: nonAdminUser.id,
        setting: PermissionSettingForRoute.grant
      })

      const permissionCount = 1

      const res = await request(app)
        .get('/SASjsApi/permission/')
        .auth(accessToken, { type: 'bearer' })
        .send()
        .expect(200)

      expect(res.body).toHaveLength(permissionCount)
    })
  })

  describe('verify', () => {
    beforeAll(async () => {
      await permissionController.createPermission({
        ...permission,
        path: '/SASjsApi/drive/deploy',
        principalId: dbUser.id
      })
    })

    beforeEach(() => {
      jest
        .spyOn(DriveController.prototype, 'deploy')
        .mockImplementation((deployPayload) =>
          Promise.resolve({
            status: 'success',
            message: 'Files deployed successfully to @sasjs/server.'
          })
        )
    })

    afterEach(() => {
      jest.resetAllMocks()
    })

    it('should create files in SASJS drive', async () => {
      const accessToken = await generateAndSaveToken(dbUser.id)

      await request(app)
        .get('/SASjsApi/drive/deploy')
        .auth(accessToken, { type: 'bearer' })
        .send(deployPayload)
        .expect(200)
    })

    it('should respond unauthorized', async () => {
      const accessToken = await generateAndSaveToken(dbUser.id)

      await request(app)
        .get('/SASjsApi/drive/deploy/upload')
        .auth(accessToken, { type: 'bearer' })
        .send()
        .expect(401)
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
