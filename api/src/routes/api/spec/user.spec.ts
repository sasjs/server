import { Express } from 'express'
import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'
import appPromise from '../../../app'
import { UserController } from '../../../controllers/'
import { generateAccessToken, saveTokensInDB } from '../../../utils'

const clientId = 'someclientID'
const adminUser = {
  displayName: 'Test Admin',
  username: 'testadminusername',
  password: '12345678',
  isAdmin: true,
  isActive: true
}
const user = {
  displayName: 'Test User',
  username: 'testusername',
  password: '87654321',
  isAdmin: false,
  isActive: true,
  autoExec: 'some sas code for auto exec;'
}

const controller = new UserController()

describe('user', () => {
  let app: Express
  let con: Mongoose
  let mongoServer: MongoMemoryServer

  beforeAll(async () => {
    app = await appPromise

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

    beforeEach(async () => {
      adminAccessToken = await generateSaveTokenAndCreateUser()
    })

    afterEach(async () => {
      await deleteAllUsers()
    })

    it('should respond with new user', async () => {
      const res = await request(app)
        .post('/SASjsApi/user')
        .auth(adminAccessToken, { type: 'bearer' })
        .send(user)
        .expect(200)

      expect(res.body.username).toEqual(user.username)
      expect(res.body.displayName).toEqual(user.displayName)
      expect(res.body.isAdmin).toEqual(user.isAdmin)
      expect(res.body.isActive).toEqual(user.isActive)
      expect(res.body.autoExec).toEqual(user.autoExec)
    })

    it('should respond with new user having username as lowercase', async () => {
      const res = await request(app)
        .post('/SASjsApi/user')
        .auth(adminAccessToken, { type: 'bearer' })
        .send({ ...user, username: user.username.toUpperCase() })
        .expect(200)

      expect(res.body.username).toEqual(user.username)
      expect(res.body.displayName).toEqual(user.displayName)
      expect(res.body.isAdmin).toEqual(user.isAdmin)
      expect(res.body.isActive).toEqual(user.isActive)
      expect(res.body.autoExec).toEqual(user.autoExec)
    })

    it('should respond with Unauthorized if access token is not present', async () => {
      const res = await request(app)
        .post('/SASjsApi/user')
        .send(user)
        .expect(401)

      expect(res.text).toEqual('Unauthorized')
      expect(res.body).toEqual({})
    })

    it('should respond with Unauthorized if access token is not of an admin account', async () => {
      const dbUser = await controller.createUser(user)
      const accessToken = generateAccessToken({
        clientId,
        userId: dbUser.id
      })
      await saveTokensInDB(dbUser.id, clientId, accessToken, 'refreshToken')

      const res = await request(app)
        .post('/SASjsApi/user')
        .auth(accessToken, { type: 'bearer' })
        .send(user)
        .expect(401)

      expect(res.text).toEqual('Admin account required')
      expect(res.body).toEqual({})
    })

    it('should respond with Forbidden if username is already present', async () => {
      await controller.createUser(user)

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

    it('should respond with Bad Request if displayName is missing', async () => {
      const res = await request(app)
        .post('/SASjsApi/user')
        .auth(adminAccessToken, { type: 'bearer' })
        .send({
          ...user,
          displayName: undefined
        })
        .expect(400)

      expect(res.text).toEqual(`"displayName" is required`)
      expect(res.body).toEqual({})
    })
  })

  describe('update', () => {
    let adminAccessToken: string

    beforeEach(async () => {
      adminAccessToken = await generateSaveTokenAndCreateUser()
    })

    afterEach(async () => {
      await deleteAllUsers()
    })

    it('should respond with updated user when admin user requests', async () => {
      const dbUser = await controller.createUser(user)
      const newDisplayName = 'My new display Name'

      const res = await request(app)
        .patch(`/SASjsApi/user/${dbUser.id}`)
        .auth(adminAccessToken, { type: 'bearer' })
        .send({ ...user, displayName: newDisplayName })
        .expect(200)

      expect(res.body.username).toEqual(user.username)
      expect(res.body.displayName).toEqual(newDisplayName)
      expect(res.body.isAdmin).toEqual(user.isAdmin)
      expect(res.body.isActive).toEqual(user.isActive)
    })

    it('should respond with updated user when user himself requests', async () => {
      const dbUser = await controller.createUser(user)
      const accessToken = await generateAndSaveToken(dbUser.id)
      const newDisplayName = 'My new display Name'

      const res = await request(app)
        .patch(`/SASjsApi/user/${dbUser.id}`)
        .auth(accessToken, { type: 'bearer' })
        .send({
          displayName: newDisplayName,
          username: user.username,
          password: user.password
        })
        .expect(200)

      expect(res.body.username).toEqual(user.username)
      expect(res.body.displayName).toEqual(newDisplayName)
      expect(res.body.isAdmin).toEqual(user.isAdmin)
      expect(res.body.isActive).toEqual(user.isActive)
    })

    it('should respond with Bad Request, only admin can update isAdmin/isActive', async () => {
      const dbUser = await controller.createUser(user)
      const accessToken = await generateAndSaveToken(dbUser.id)
      const newDisplayName = 'My new display Name'

      await request(app)
        .patch(`/SASjsApi/user/${dbUser.id}`)
        .auth(accessToken, { type: 'bearer' })
        .send({ ...user, displayName: newDisplayName })
        .expect(400)
    })

    it('should respond with Unauthorized if access token is not present', async () => {
      const res = await request(app)
        .patch('/SASjsApi/user/1234')
        .send(user)
        .expect(401)

      expect(res.text).toEqual('Unauthorized')
      expect(res.body).toEqual({})
    })

    it('should respond with Unauthorized when access token is not of an admin account or himself', async () => {
      const dbUser1 = await controller.createUser(user)
      const dbUser2 = await controller.createUser({
        ...user,
        username: 'randomUser'
      })
      const accessToken = await generateAndSaveToken(dbUser2.id)

      const res = await request(app)
        .patch(`/SASjsApi/user/${dbUser1.id}`)
        .auth(accessToken, { type: 'bearer' })
        .send(user)
        .expect(401)

      expect(res.text).toEqual('Admin account required')
      expect(res.body).toEqual({})
    })

    it('should respond with Forbidden if username is already present', async () => {
      const dbUser1 = await controller.createUser(user)
      const dbUser2 = await controller.createUser({
        ...user,
        username: 'randomuser'
      })

      const res = await request(app)
        .patch(`/SASjsApi/user/${dbUser1.id}`)
        .auth(adminAccessToken, { type: 'bearer' })
        .send({ username: dbUser2.username })
        .expect(403)

      expect(res.text).toEqual('Error: Username already exists.')
      expect(res.body).toEqual({})
    })

    describe('by username', () => {
      it('should respond with updated user when admin user requests', async () => {
        const dbUser = await controller.createUser(user)
        const newDisplayName = 'My new display Name'

        const res = await request(app)
          .patch(`/SASjsApi/user/by/username/${user.username}`)
          .auth(adminAccessToken, { type: 'bearer' })
          .send({ ...user, displayName: newDisplayName })
          .expect(200)

        expect(res.body.username).toEqual(user.username)
        expect(res.body.displayName).toEqual(newDisplayName)
        expect(res.body.isAdmin).toEqual(user.isAdmin)
        expect(res.body.isActive).toEqual(user.isActive)
      })

      it('should respond with updated user when user himself requests', async () => {
        const dbUser = await controller.createUser(user)
        const accessToken = await generateAndSaveToken(dbUser.id)
        const newDisplayName = 'My new display Name'

        const res = await request(app)
          .patch(`/SASjsApi/user/by/username/${user.username}`)
          .auth(accessToken, { type: 'bearer' })
          .send({
            displayName: newDisplayName,
            username: user.username,
            password: user.password
          })
          .expect(200)

        expect(res.body.username).toEqual(user.username)
        expect(res.body.displayName).toEqual(newDisplayName)
        expect(res.body.isAdmin).toEqual(user.isAdmin)
        expect(res.body.isActive).toEqual(user.isActive)
      })

      it('should respond with Bad Request, only admin can update isAdmin/isActive', async () => {
        const dbUser = await controller.createUser(user)
        const accessToken = await generateAndSaveToken(dbUser.id)
        const newDisplayName = 'My new display Name'

        await request(app)
          .patch(`/SASjsApi/user/by/username/${user.username}`)
          .auth(accessToken, { type: 'bearer' })
          .send({ ...user, displayName: newDisplayName })
          .expect(400)
      })

      it('should respond with Unauthorized if access token is not present', async () => {
        const res = await request(app)
          .patch('/SASjsApi/user/by/username/1234')
          .send(user)
          .expect(401)

        expect(res.text).toEqual('Unauthorized')
        expect(res.body).toEqual({})
      })

      it('should respond with Unauthorized when access token is not of an admin account or himself', async () => {
        const dbUser1 = await controller.createUser(user)
        const dbUser2 = await controller.createUser({
          ...user,
          username: 'randomUser'
        })
        const accessToken = await generateAndSaveToken(dbUser2.id)

        const res = await request(app)
          .patch(`/SASjsApi/user/${dbUser1.id}`)
          .auth(accessToken, { type: 'bearer' })
          .send(user)
          .expect(401)

        expect(res.text).toEqual('Admin account required')
        expect(res.body).toEqual({})
      })

      it('should respond with Forbidden if username is already present', async () => {
        const dbUser1 = await controller.createUser(user)
        const dbUser2 = await controller.createUser({
          ...user,
          username: 'randomuser'
        })

        const res = await request(app)
          .patch(`/SASjsApi/user/by/username/${dbUser1.username}`)
          .auth(adminAccessToken, { type: 'bearer' })
          .send({ username: dbUser2.username })
          .expect(403)

        expect(res.text).toEqual('Error: Username already exists.')
        expect(res.body).toEqual({})
      })
    })
  })

  describe('delete', () => {
    let adminAccessToken: string

    beforeEach(async () => {
      adminAccessToken = await generateSaveTokenAndCreateUser()
    })

    afterEach(async () => {
      await deleteAllUsers()
    })

    it('should respond with OK when admin user requests', async () => {
      const dbUser = await controller.createUser(user)

      const res = await request(app)
        .delete(`/SASjsApi/user/${dbUser.id}`)
        .auth(adminAccessToken, { type: 'bearer' })
        .send()
        .expect(200)

      expect(res.body).toEqual({})
    })

    it('should respond with OK when user himself requests', async () => {
      const dbUser = await controller.createUser(user)
      const accessToken = await generateAndSaveToken(dbUser.id)

      const res = await request(app)
        .delete(`/SASjsApi/user/${dbUser.id}`)
        .auth(accessToken, { type: 'bearer' })
        .send({ password: user.password })
        .expect(200)

      expect(res.body).toEqual({})
    })

    it('should respond with Bad Request when user himself requests and password is missing', async () => {
      const dbUser = await controller.createUser(user)
      const accessToken = await generateAndSaveToken(dbUser.id)

      const res = await request(app)
        .delete(`/SASjsApi/user/${dbUser.id}`)
        .auth(accessToken, { type: 'bearer' })
        .send()
        .expect(400)

      expect(res.text).toEqual(`"password" is required`)
      expect(res.body).toEqual({})
    })

    it('should respond with Unauthorized when access token is not present', async () => {
      const res = await request(app)
        .delete('/SASjsApi/user/1234')
        .send(user)
        .expect(401)

      expect(res.text).toEqual('Unauthorized')
      expect(res.body).toEqual({})
    })

    it('should respond with Unauthorized when access token is not of an admin account or himself', async () => {
      const dbUser1 = await controller.createUser(user)
      const dbUser2 = await controller.createUser({
        ...user,
        username: 'randomUser'
      })
      const accessToken = await generateAndSaveToken(dbUser2.id)

      const res = await request(app)
        .delete(`/SASjsApi/user/${dbUser1.id}`)
        .auth(accessToken, { type: 'bearer' })
        .send(user)
        .expect(401)

      expect(res.text).toEqual('Admin account required')
      expect(res.body).toEqual({})
    })

    it('should respond with Forbidden when user himself requests and password is incorrect', async () => {
      const dbUser = await controller.createUser(user)
      const accessToken = await generateAndSaveToken(dbUser.id)

      const res = await request(app)
        .delete(`/SASjsApi/user/${dbUser.id}`)
        .auth(accessToken, { type: 'bearer' })
        .send({ password: 'incorrectpassword' })
        .expect(403)

      expect(res.text).toEqual('Error: Invalid password.')
      expect(res.body).toEqual({})
    })

    describe('by username', () => {
      it('should respond with OK when admin user requests', async () => {
        const dbUser = await controller.createUser(user)

        const res = await request(app)
          .delete(`/SASjsApi/user/by/username/${dbUser.username}`)
          .auth(adminAccessToken, { type: 'bearer' })
          .send()
          .expect(200)

        expect(res.body).toEqual({})
      })

      it('should respond with OK when user himself requests', async () => {
        const dbUser = await controller.createUser(user)
        const accessToken = await generateAndSaveToken(dbUser.id)

        const res = await request(app)
          .delete(`/SASjsApi/user/by/username/${dbUser.username}`)
          .auth(accessToken, { type: 'bearer' })
          .send({ password: user.password })
          .expect(200)

        expect(res.body).toEqual({})
      })

      it('should respond with Bad Request when user himself requests and password is missing', async () => {
        const dbUser = await controller.createUser(user)
        const accessToken = await generateAndSaveToken(dbUser.id)

        const res = await request(app)
          .delete(`/SASjsApi/user/by/username/${dbUser.username}`)
          .auth(accessToken, { type: 'bearer' })
          .send()
          .expect(400)

        expect(res.text).toEqual(`"password" is required`)
        expect(res.body).toEqual({})
      })

      it('should respond with Unauthorized when access token is not present', async () => {
        const res = await request(app)
          .delete('/SASjsApi/user/by/username/RandomUsername')
          .send(user)
          .expect(401)

        expect(res.text).toEqual('Unauthorized')
        expect(res.body).toEqual({})
      })

      it('should respond with Unauthorized when access token is not of an admin account or himself', async () => {
        const dbUser1 = await controller.createUser(user)
        const dbUser2 = await controller.createUser({
          ...user,
          username: 'randomUser'
        })
        const accessToken = await generateAndSaveToken(dbUser2.id)

        const res = await request(app)
          .delete(`/SASjsApi/user/by/username/${dbUser1.username}`)
          .auth(accessToken, { type: 'bearer' })
          .send(user)
          .expect(401)

        expect(res.text).toEqual('Admin account required')
        expect(res.body).toEqual({})
      })

      it('should respond with Forbidden when user himself requests and password is incorrect', async () => {
        const dbUser = await controller.createUser(user)
        const accessToken = await generateAndSaveToken(dbUser.id)

        const res = await request(app)
          .delete(`/SASjsApi/user/by/username/${dbUser.username}`)
          .auth(accessToken, { type: 'bearer' })
          .send({ password: 'incorrectpassword' })
          .expect(403)

        expect(res.text).toEqual('Error: Invalid password.')
        expect(res.body).toEqual({})
      })
    })
  })

  describe('get', () => {
    let adminAccessToken: string

    beforeEach(async () => {
      adminAccessToken = await generateSaveTokenAndCreateUser()
    })

    afterEach(async () => {
      await deleteAllUsers()
    })

    it('should respond with user autoExec when same user requests', async () => {
      const dbUser = await controller.createUser(user)
      const userId = dbUser.id
      const accessToken = await generateAndSaveToken(userId)

      const res = await request(app)
        .get(`/SASjsApi/user/${userId}`)
        .auth(accessToken, { type: 'bearer' })
        .send()
        .expect(200)

      expect(res.body.username).toEqual(user.username)
      expect(res.body.displayName).toEqual(user.displayName)
      expect(res.body.isAdmin).toEqual(user.isAdmin)
      expect(res.body.isActive).toEqual(user.isActive)
      expect(res.body.autoExec).toEqual(user.autoExec)
    })

    it('should respond with user autoExec when admin user requests', async () => {
      const dbUser = await controller.createUser(user)
      const userId = dbUser.id

      const res = await request(app)
        .get(`/SASjsApi/user/${userId}`)
        .auth(adminAccessToken, { type: 'bearer' })
        .send()
        .expect(200)

      expect(res.body.username).toEqual(user.username)
      expect(res.body.displayName).toEqual(user.displayName)
      expect(res.body.isAdmin).toEqual(user.isAdmin)
      expect(res.body.isActive).toEqual(user.isActive)
      expect(res.body.autoExec).toEqual(user.autoExec)
    })

    it('should respond with user when access token is not of an admin account', async () => {
      const accessToken = await generateSaveTokenAndCreateUser({
        ...user,
        username: 'randomUser'
      })

      const dbUser = await controller.createUser(user)
      const userId = dbUser.id

      const res = await request(app)
        .get(`/SASjsApi/user/${userId}`)
        .auth(accessToken, { type: 'bearer' })
        .send()
        .expect(200)

      expect(res.body.username).toEqual(user.username)
      expect(res.body.displayName).toEqual(user.displayName)
      expect(res.body.isAdmin).toEqual(user.isAdmin)
      expect(res.body.isActive).toEqual(user.isActive)
      expect(res.body.autoExec).toBeUndefined()
    })

    it('should respond with Unauthorized if access token is not present', async () => {
      const res = await request(app)
        .get('/SASjsApi/user/1234')
        .send()
        .expect(401)

      expect(res.text).toEqual('Unauthorized')
      expect(res.body).toEqual({})
    })

    it('should respond with Forbidden if userId is incorrect', async () => {
      await controller.createUser(user)

      const res = await request(app)
        .get('/SASjsApi/user/1234')
        .auth(adminAccessToken, { type: 'bearer' })
        .send()
        .expect(403)

      expect(res.text).toEqual('Error: User is not found.')
      expect(res.body).toEqual({})
    })

    describe('by username', () => {
      it('should respond with user autoExec when same user requests', async () => {
        const dbUser = await controller.createUser(user)
        const userId = dbUser.id
        const accessToken = await generateAndSaveToken(userId)

        const res = await request(app)
          .get(`/SASjsApi/user/by/username/${dbUser.username}`)
          .auth(accessToken, { type: 'bearer' })
          .send()
          .expect(200)

        expect(res.body.username).toEqual(user.username)
        expect(res.body.displayName).toEqual(user.displayName)
        expect(res.body.isAdmin).toEqual(user.isAdmin)
        expect(res.body.isActive).toEqual(user.isActive)
        expect(res.body.autoExec).toEqual(user.autoExec)
      })

      it('should respond with user autoExec when admin user requests', async () => {
        const dbUser = await controller.createUser(user)

        const res = await request(app)
          .get(`/SASjsApi/user/by/username/${dbUser.username}`)
          .auth(adminAccessToken, { type: 'bearer' })
          .send()
          .expect(200)

        expect(res.body.username).toEqual(user.username)
        expect(res.body.displayName).toEqual(user.displayName)
        expect(res.body.isAdmin).toEqual(user.isAdmin)
        expect(res.body.isActive).toEqual(user.isActive)
        expect(res.body.autoExec).toEqual(user.autoExec)
      })

      it('should respond with user when access token is not of an admin account', async () => {
        const accessToken = await generateSaveTokenAndCreateUser({
          ...user,
          username: 'randomUser'
        })

        const dbUser = await controller.createUser(user)

        const res = await request(app)
          .get(`/SASjsApi/user/by/username/${dbUser.username}`)
          .auth(accessToken, { type: 'bearer' })
          .send()
          .expect(200)

        expect(res.body.username).toEqual(user.username)
        expect(res.body.displayName).toEqual(user.displayName)
        expect(res.body.isAdmin).toEqual(user.isAdmin)
        expect(res.body.isActive).toEqual(user.isActive)
        expect(res.body.autoExec).toBeUndefined()
      })

      it('should respond with Unauthorized if access token is not present', async () => {
        const res = await request(app)
          .get('/SASjsApi/user/by/username/randomUsername')
          .send()
          .expect(401)

        expect(res.text).toEqual('Unauthorized')
        expect(res.body).toEqual({})
      })

      it('should respond with Forbidden if username is incorrect', async () => {
        await controller.createUser(user)

        const res = await request(app)
          .get('/SASjsApi/user/by/username/randomUsername')
          .auth(adminAccessToken, { type: 'bearer' })
          .send()
          .expect(403)

        expect(res.text).toEqual('Error: User is not found.')
        expect(res.body).toEqual({})
      })
    })
  })

  describe('getAll', () => {
    let adminAccessToken: string

    beforeEach(async () => {
      adminAccessToken = await generateSaveTokenAndCreateUser()
    })

    afterEach(async () => {
      await deleteAllUsers()
    })

    it('should respond with all users', async () => {
      await controller.createUser(user)

      const res = await request(app)
        .get('/SASjsApi/user')
        .auth(adminAccessToken, { type: 'bearer' })
        .send()
        .expect(200)

      expect(res.body).toEqual([
        {
          id: expect.anything(),
          username: adminUser.username,
          displayName: adminUser.displayName
        },
        {
          id: expect.anything(),
          username: user.username,
          displayName: user.displayName
        }
      ])
    })

    it('should respond with all users when access token is not of an admin account', async () => {
      const accessToken = await generateSaveTokenAndCreateUser({
        ...user,
        username: 'randomUser'
      })

      const res = await request(app)
        .get('/SASjsApi/user')
        .auth(accessToken, { type: 'bearer' })
        .send()
        .expect(200)

      expect(res.body).toEqual([
        {
          id: expect.anything(),
          username: adminUser.username,
          displayName: adminUser.displayName
        },
        {
          id: expect.anything(),
          username: 'randomUser',
          displayName: user.displayName
        }
      ])
    })

    it('should respond with Unauthorized if access token is not present', async () => {
      const res = await request(app).get('/SASjsApi/user').send().expect(401)

      expect(res.text).toEqual('Unauthorized')
      expect(res.body).toEqual({})
    })
  })
})

const generateSaveTokenAndCreateUser = async (
  someUser?: any
): Promise<string> => {
  const dbUser = await controller.createUser(someUser ?? adminUser)

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

const deleteAllUsers = async () => {
  const { collections } = mongoose.connection
  const collection = collections['users']
  await collection.deleteMany({})
}
