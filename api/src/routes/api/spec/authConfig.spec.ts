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

// A distinctive value so it can be searched for anywhere in the serialised
// response - not just at the field we expect it to have been removed from.
const BIND_PASSWORD = 'bind-password-must-never-be-returned'

const controller = new UserController()

describe('authConfig', () => {
  let app: Express
  let con: Mongoose
  let mongoServer: MongoMemoryServer

  beforeAll(async () => {
    app = await appPromise

    // wiredTiger is specified explicitly rather than relying on
    // MongoMemoryServer's default: the default is `ephemeralForTest`, which
    // was removed in MongoDB 7.0, so leaving it implicit pins these tests to
    // an old mongod.
    mongoServer = await MongoMemoryServer.create({
      instance: { storageEngine: 'wiredTiger' }
    })
    con = await mongoose.connect(mongoServer.getUri())
  })

  afterAll(async () => {
    await con.connection.dropDatabase()
    await con.connection.close()
    await mongoServer.stop()
  })

  describe('getDetail', () => {
    let adminAccessToken: string
    const originalEnv = { ...process.env }
    const managedEnvVars = [
      'AUTH_PROVIDERS',
      'LDAP_URL',
      'LDAP_BIND_DN',
      'LDAP_BIND_PASSWORD',
      'LDAP_USERS_BASE_DN',
      'LDAP_GROUPS_BASE_DN'
    ]

    beforeEach(async () => {
      adminAccessToken = await generateSaveTokenAndCreateUser()
    })

    afterEach(async () => {
      // Restore by deletion where the variable was originally unset: assigning
      // `process.env.X = undefined` stores the string "undefined", which would
      // leak into sibling specs sharing this worker.
      managedEnvVars.forEach((key) => {
        if (originalEnv[key] === undefined) delete process.env[key]
        else process.env[key] = originalEnv[key]
      })

      await deleteAllUsers()
    })

    it('should return the non-secret LDAP settings when AUTH_PROVIDERS is ldap', async () => {
      process.env.AUTH_PROVIDERS = 'ldap'
      process.env.LDAP_URL = 'ldaps://my.ldap.server:636'
      process.env.LDAP_BIND_DN = 'cn=admin,ou=system,dc=cloudron'
      process.env.LDAP_BIND_PASSWORD = BIND_PASSWORD
      process.env.LDAP_USERS_BASE_DN = 'ou=users,dc=cloudron'
      process.env.LDAP_GROUPS_BASE_DN = 'ou=groups,dc=cloudron'

      const res = await request(app)
        .get('/SASjsApi/authConfig')
        .auth(adminAccessToken, { type: 'bearer' })
        .expect(200)

      expect(res.body.ldap.LDAP_URL).toEqual('ldaps://my.ldap.server:636')
      expect(res.body.ldap.LDAP_BIND_DN).toEqual(
        'cn=admin,ou=system,dc=cloudron'
      )
      expect(res.body.ldap.LDAP_USERS_BASE_DN).toEqual('ou=users,dc=cloudron')
      expect(res.body.ldap.LDAP_GROUPS_BASE_DN).toEqual('ou=groups,dc=cloudron')
      expect(res.body.ldap.LDAP_BIND_PASSWORD_SET).toEqual(true)
    })

    it('should never return the LDAP bind password', async () => {
      process.env.AUTH_PROVIDERS = 'ldap'
      process.env.LDAP_URL = 'ldaps://my.ldap.server:636'
      process.env.LDAP_BIND_DN = 'cn=admin,ou=system,dc=cloudron'
      process.env.LDAP_BIND_PASSWORD = BIND_PASSWORD
      process.env.LDAP_USERS_BASE_DN = 'ou=users,dc=cloudron'
      process.env.LDAP_GROUPS_BASE_DN = 'ou=groups,dc=cloudron'

      const res = await request(app)
        .get('/SASjsApi/authConfig')
        .auth(adminAccessToken, { type: 'bearer' })
        .expect(200)

      expect(res.body.ldap.LDAP_BIND_PASSWORD).toBeUndefined()
      expect(res.text).not.toContain(BIND_PASSWORD)
    })

    it('should report the bind password as not configured when it is unset', async () => {
      process.env.AUTH_PROVIDERS = 'ldap'
      delete process.env.LDAP_BIND_PASSWORD

      const res = await request(app)
        .get('/SASjsApi/authConfig')
        .auth(adminAccessToken, { type: 'bearer' })
        .expect(200)

      expect(res.body.ldap.LDAP_BIND_PASSWORD_SET).toEqual(false)
    })

    it('should respond with an empty object when no external auth provider is configured', async () => {
      delete process.env.AUTH_PROVIDERS

      const res = await request(app)
        .get('/SASjsApi/authConfig')
        .auth(adminAccessToken, { type: 'bearer' })
        .expect(200)

      expect(res.body).toEqual({})
    })

    it('should respond with Unauthorized if the caller is not authenticated', async () => {
      const res = await request(app).get('/SASjsApi/authConfig').expect(401)

      expect(res.text).toEqual('Unauthorized')
      expect(res.body).toEqual({})
    })
  })
})

const generateSaveTokenAndCreateUser = async (
  someUser?: any
): Promise<string> => {
  const dbUser = await controller.createUser(someUser ?? adminUser)

  return generateAndSaveToken(dbUser.uid)
}

const generateAndSaveToken = async (userId: string) => {
  const accessToken = generateAccessToken({
    clientId,
    userId
  })
  await saveTokensInDB(userId, clientId, accessToken, 'refreshToken')
  return accessToken
}

const deleteAllUsers = async () => {
  const { collections } = mongoose.connection
  const collection = collections['users']
  await collection.deleteMany({})
}
