import { Express } from 'express'
import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'
import appPromise from '../../../app'
import { UserController, GroupController } from '../../../controllers/'
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

const group = {
  name: 'dcgroup1',
  description: 'DC group for testing purposes.'
}

const userController = new UserController()
const groupController = new GroupController()

describe('group', () => {
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
      await deleteAllGroups()
    })

    it('should respond with new group', async () => {
      const res = await request(app)
        .post('/SASjsApi/group')
        .auth(adminAccessToken, { type: 'bearer' })
        .send(group)
        .expect(200)

      expect(res.body.groupId).toBeTruthy()
      expect(res.body.name).toEqual(group.name)
      expect(res.body.description).toEqual(group.description)
      expect(res.body.isActive).toEqual(true)
      expect(res.body.users).toEqual([])
    })

    it('should respond with Conflict when group already exists with same name', async () => {
      await groupController.createGroup(group)

      const res = await request(app)
        .post('/SASjsApi/group')
        .auth(adminAccessToken, { type: 'bearer' })
        .send(group)
        .expect(409)

      expect(res.text).toEqual('Group name already exists.')
      expect(res.body).toEqual({})
    })

    it('should respond with Unauthorized if access token is not present', async () => {
      const res = await request(app).post('/SASjsApi/group').send().expect(401)

      expect(res.text).toEqual('Unauthorized')
      expect(res.body).toEqual({})
    })

    it('should respond with Unauthorized if access token is not of an admin account', async () => {
      const accessToken = await generateSaveTokenAndCreateUser({
        ...user,
        username: 'create' + user.username
      })

      const res = await request(app)
        .post('/SASjsApi/group')
        .auth(accessToken, { type: 'bearer' })
        .send()
        .expect(401)

      expect(res.text).toEqual('Admin account required')
      expect(res.body).toEqual({})
    })

    it('should respond with Bad Request if name is missing', async () => {
      const res = await request(app)
        .post('/SASjsApi/group')
        .auth(adminAccessToken, { type: 'bearer' })
        .send({
          ...group,
          name: undefined
        })
        .expect(400)

      expect(res.text).toEqual(`"name" is required`)
      expect(res.body).toEqual({})
    })
  })

  describe('delete', () => {
    afterEach(async () => {
      await deleteAllGroups()
    })

    it('should respond with OK when admin user requests', async () => {
      const dbGroup = await groupController.createGroup(group)

      const res = await request(app)
        .delete(`/SASjsApi/group/${dbGroup.groupId}`)
        .auth(adminAccessToken, { type: 'bearer' })
        .send()
        .expect(200)

      expect(res.body).toEqual({})
    })

    it(`should delete group's reference from users' groups array`, async () => {
      const dbGroup = await groupController.createGroup(group)
      const dbUser1 = await userController.createUser({
        ...user,
        username: 'deletegroup1'
      })
      const dbUser2 = await userController.createUser({
        ...user,
        username: 'deletegroup2'
      })

      await groupController.addUserToGroup(dbGroup.groupId, dbUser1.id)
      await groupController.addUserToGroup(dbGroup.groupId, dbUser2.id)

      await request(app)
        .delete(`/SASjsApi/group/${dbGroup.groupId}`)
        .auth(adminAccessToken, { type: 'bearer' })
        .send()
        .expect(200)

      const res1 = await request(app)
        .get(`/SASjsApi/user/${dbUser1.id}`)
        .auth(adminAccessToken, { type: 'bearer' })
        .send()
        .expect(200)

      expect(res1.body.groups).toEqual([])

      const res2 = await request(app)
        .get(`/SASjsApi/user/${dbUser2.id}`)
        .auth(adminAccessToken, { type: 'bearer' })
        .send()
        .expect(200)

      expect(res2.body.groups).toEqual([])
    })

    it('should respond with Not Found if groupId is incorrect', async () => {
      const res = await request(app)
        .delete(`/SASjsApi/group/1234`)
        .auth(adminAccessToken, { type: 'bearer' })
        .send()
        .expect(404)

      expect(res.text).toEqual('Group not found.')
      expect(res.body).toEqual({})
    })

    it('should respond with Unauthorized when access token is not present', async () => {
      const res = await request(app)
        .delete('/SASjsApi/group/1234')
        .send()
        .expect(401)

      expect(res.text).toEqual('Unauthorized')
      expect(res.body).toEqual({})
    })

    it('should respond with Unauthorized when access token is not of an admin account', async () => {
      const dbGroup = await groupController.createGroup(group)
      const accessToken = await generateSaveTokenAndCreateUser({
        ...user,
        username: 'delete' + user.username
      })

      const res = await request(app)
        .delete(`/SASjsApi/group/${dbGroup.groupId}`)
        .auth(accessToken, { type: 'bearer' })
        .send()
        .expect(401)

      expect(res.text).toEqual('Admin account required')
      expect(res.body).toEqual({})
    })
  })

  describe('get', () => {
    afterEach(async () => {
      await deleteAllGroups()
    })

    it('should respond with group', async () => {
      const { groupId } = await groupController.createGroup(group)

      const res = await request(app)
        .get(`/SASjsApi/group/${groupId}`)
        .auth(adminAccessToken, { type: 'bearer' })
        .send()
        .expect(200)

      expect(res.body.groupId).toBeTruthy()
      expect(res.body.name).toEqual(group.name)
      expect(res.body.description).toEqual(group.description)
      expect(res.body.isActive).toEqual(true)
      expect(res.body.users).toEqual([])
    })

    it('should respond with group when access token is not of an admin account', async () => {
      const accessToken = await generateSaveTokenAndCreateUser({
        ...user,
        username: 'get' + user.username
      })

      const { groupId } = await groupController.createGroup(group)

      const res = await request(app)
        .get(`/SASjsApi/group/${groupId}`)
        .auth(accessToken, { type: 'bearer' })
        .send()
        .expect(200)

      expect(res.body.groupId).toBeTruthy()
      expect(res.body.name).toEqual(group.name)
      expect(res.body.description).toEqual(group.description)
      expect(res.body.isActive).toEqual(true)
      expect(res.body.users).toEqual([])
    })

    it('should respond with Unauthorized if access token is not present', async () => {
      const res = await request(app)
        .get('/SASjsApi/group/1234')
        .send()
        .expect(401)

      expect(res.text).toEqual('Unauthorized')
      expect(res.body).toEqual({})
    })

    it('should respond with Not Found if groupId is incorrect', async () => {
      const res = await request(app)
        .get('/SASjsApi/group/1234')
        .auth(adminAccessToken, { type: 'bearer' })
        .send()
        .expect(404)

      expect(res.text).toEqual('Group not found.')
      expect(res.body).toEqual({})
    })

    describe('by group name', () => {
      it('should respond with group', async () => {
        const { name } = await groupController.createGroup(group)

        const res = await request(app)
          .get(`/SASjsApi/group/by/groupname/${name}`)
          .auth(adminAccessToken, { type: 'bearer' })
          .send()
          .expect(200)

        expect(res.body.groupId).toBeTruthy()
        expect(res.body.name).toEqual(group.name)
        expect(res.body.description).toEqual(group.description)
        expect(res.body.isActive).toEqual(true)
        expect(res.body.users).toEqual([])
      })

      it('should respond with group when access token is not of an admin account', async () => {
        const accessToken = await generateSaveTokenAndCreateUser({
          ...user,
          username: 'getbyname' + user.username
        })

        const { name } = await groupController.createGroup(group)

        const res = await request(app)
          .get(`/SASjsApi/group/by/groupname/${name}`)
          .auth(accessToken, { type: 'bearer' })
          .send()
          .expect(200)

        expect(res.body.groupId).toBeTruthy()
        expect(res.body.name).toEqual(group.name)
        expect(res.body.description).toEqual(group.description)
        expect(res.body.isActive).toEqual(true)
        expect(res.body.users).toEqual([])
      })

      it('should respond with Unauthorized if access token is not present', async () => {
        const res = await request(app)
          .get('/SASjsApi/group/by/groupname/dcgroup')
          .send()
          .expect(401)

        expect(res.text).toEqual('Unauthorized')
        expect(res.body).toEqual({})
      })

      it('should respond with Not Found if groupname is incorrect', async () => {
        const res = await request(app)
          .get('/SASjsApi/group/by/groupname/randomCharacters')
          .auth(adminAccessToken, { type: 'bearer' })
          .send()
          .expect(404)

        expect(res.text).toEqual('Group not found.')
        expect(res.body).toEqual({})
      })
    })
  })

  describe('getAll', () => {
    afterEach(async () => {
      await deleteAllGroups()
    })

    it('should respond with all groups', async () => {
      await groupController.createGroup(group)

      const res = await request(app)
        .get('/SASjsApi/group')
        .auth(adminAccessToken, { type: 'bearer' })
        .send()
        .expect(200)

      expect(res.body).toEqual([
        {
          groupId: expect.anything(),
          name: group.name,
          description: group.description
        }
      ])
    })

    it('should respond with all groups when access token is not of an admin account', async () => {
      await groupController.createGroup(group)
      const accessToken = await generateSaveTokenAndCreateUser({
        ...user,
        username: 'getAllrandomUser'
      })

      const res = await request(app)
        .get('/SASjsApi/group')
        .auth(accessToken, { type: 'bearer' })
        .send(user)
        .expect(200)

      expect(res.body).toEqual([
        {
          groupId: expect.anything(),
          name: group.name,
          description: group.description
        }
      ])
    })

    it('should respond with Unauthorized if access token is not present', async () => {
      const res = await request(app).get('/SASjsApi/group').send().expect(401)

      expect(res.text).toEqual('Unauthorized')
      expect(res.body).toEqual({})
    })
  })

  describe('AddUser', () => {
    afterEach(async () => {
      await deleteAllGroups()
    })

    it('should respond with group having new user in it', async () => {
      const dbGroup = await groupController.createGroup(group)
      const dbUser = await userController.createUser(user)

      const res = await request(app)
        .post(`/SASjsApi/group/${dbGroup.groupId}/${dbUser.id}`)
        .auth(adminAccessToken, { type: 'bearer' })
        .send()
        .expect(200)

      expect(res.body.groupId).toBeTruthy()
      expect(res.body.name).toEqual(group.name)
      expect(res.body.description).toEqual(group.description)
      expect(res.body.isActive).toEqual(true)
      expect(res.body.users).toEqual([
        {
          id: expect.anything(),
          username: user.username,
          displayName: user.displayName
        }
      ])
    })

    it(`should add group to user's groups array`, async () => {
      const dbGroup = await groupController.createGroup(group)
      const dbUser = await userController.createUser({
        ...user,
        username: 'addUserToGroup'
      })

      await request(app)
        .post(`/SASjsApi/group/${dbGroup.groupId}/${dbUser.id}`)
        .auth(adminAccessToken, { type: 'bearer' })
        .send()
        .expect(200)

      const res = await request(app)
        .get(`/SASjsApi/user/${dbUser.id}`)
        .auth(adminAccessToken, { type: 'bearer' })
        .send()
        .expect(200)

      expect(res.body.groups).toEqual([
        {
          groupId: expect.anything(),
          name: group.name,
          description: group.description
        }
      ])
    })

    it('should respond with group without duplicating user', async () => {
      const dbGroup = await groupController.createGroup(group)
      const dbUser = await userController.createUser({
        ...user,
        username: 'addUserRandomUser'
      })
      await groupController.addUserToGroup(dbGroup.groupId, dbUser.id)

      const res = await request(app)
        .post(`/SASjsApi/group/${dbGroup.groupId}/${dbUser.id}`)
        .auth(adminAccessToken, { type: 'bearer' })
        .send()
        .expect(200)

      expect(res.body.groupId).toBeTruthy()
      expect(res.body.name).toEqual(group.name)
      expect(res.body.description).toEqual(group.description)
      expect(res.body.isActive).toEqual(true)
      expect(res.body.users).toEqual([
        {
          id: expect.anything(),
          username: 'addUserRandomUser',
          displayName: user.displayName
        }
      ])
    })

    it('should respond with Unauthorized if access token is not present', async () => {
      const res = await request(app)
        .post('/SASjsApi/group/123/123')
        .send()
        .expect(401)

      expect(res.text).toEqual('Unauthorized')
      expect(res.body).toEqual({})
    })

    it('should respond with Unauthorized if access token is not of an admin account', async () => {
      const accessToken = await generateSaveTokenAndCreateUser({
        ...user,
        username: 'addUser' + user.username
      })

      const res = await request(app)
        .post('/SASjsApi/group/123/123')
        .auth(accessToken, { type: 'bearer' })
        .send()
        .expect(401)

      expect(res.text).toEqual('Admin account required')
      expect(res.body).toEqual({})
    })

    it('should respond with Not Found if groupId is incorrect', async () => {
      const res = await request(app)
        .post('/SASjsApi/group/123/123')
        .auth(adminAccessToken, { type: 'bearer' })
        .send()
        .expect(404)

      expect(res.text).toEqual('Group not found.')
      expect(res.body).toEqual({})
    })

    it('should respond with Not Found if userId is incorrect', async () => {
      const dbGroup = await groupController.createGroup(group)
      const res = await request(app)
        .post(`/SASjsApi/group/${dbGroup.groupId}/123`)
        .auth(adminAccessToken, { type: 'bearer' })
        .send()
        .expect(404)

      expect(res.text).toEqual('User not found.')
      expect(res.body).toEqual({})
    })
  })

  describe('RemoveUser', () => {
    afterEach(async () => {
      await deleteAllGroups()
    })

    it('should respond with group having user removed from it', async () => {
      const dbGroup = await groupController.createGroup(group)
      const dbUser = await userController.createUser({
        ...user,
        username: 'removeUserRandomUser'
      })
      await groupController.addUserToGroup(dbGroup.groupId, dbUser.id)

      const res = await request(app)
        .delete(`/SASjsApi/group/${dbGroup.groupId}/${dbUser.id}`)
        .auth(adminAccessToken, { type: 'bearer' })
        .send()
        .expect(200)

      expect(res.body.groupId).toBeTruthy()
      expect(res.body.name).toEqual(group.name)
      expect(res.body.description).toEqual(group.description)
      expect(res.body.isActive).toEqual(true)
      expect(res.body.users).toEqual([])
    })

    it(`should remove group from user's groups array`, async () => {
      const dbGroup = await groupController.createGroup(group)
      const dbUser = await userController.createUser({
        ...user,
        username: 'removeGroupFromUser'
      })
      await groupController.addUserToGroup(dbGroup.groupId, dbUser.id)

      await request(app)
        .delete(`/SASjsApi/group/${dbGroup.groupId}/${dbUser.id}`)
        .auth(adminAccessToken, { type: 'bearer' })
        .send()
        .expect(200)

      const res = await request(app)
        .get(`/SASjsApi/user/${dbUser.id}`)
        .auth(adminAccessToken, { type: 'bearer' })
        .send()
        .expect(200)

      expect(res.body.groups).toEqual([])
    })

    it('should respond with Unauthorized if access token is not present', async () => {
      const res = await request(app)
        .delete('/SASjsApi/group/123/123')
        .send()
        .expect(401)

      expect(res.text).toEqual('Unauthorized')
      expect(res.body).toEqual({})
    })

    it('should respond with Unauthorized if access token is not of an admin account', async () => {
      const accessToken = await generateSaveTokenAndCreateUser({
        ...user,
        username: 'removeUser' + user.username
      })

      const res = await request(app)
        .delete('/SASjsApi/group/123/123')
        .auth(accessToken, { type: 'bearer' })
        .send()
        .expect(401)

      expect(res.text).toEqual('Admin account required')
      expect(res.body).toEqual({})
    })

    it('should respond with Not Found if groupId is incorrect', async () => {
      const res = await request(app)
        .delete('/SASjsApi/group/123/123')
        .auth(adminAccessToken, { type: 'bearer' })
        .send()
        .expect(404)

      expect(res.text).toEqual('Group not found.')
      expect(res.body).toEqual({})
    })

    it('should respond with Not Found if userId is incorrect', async () => {
      const dbGroup = await groupController.createGroup(group)
      const res = await request(app)
        .delete(`/SASjsApi/group/${dbGroup.groupId}/123`)
        .auth(adminAccessToken, { type: 'bearer' })
        .send()
        .expect(404)

      expect(res.text).toEqual('User not found.')
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

const deleteAllGroups = async () => {
  const { collections } = mongoose.connection
  const collection = collections['groups']
  await collection.deleteMany({})
}
