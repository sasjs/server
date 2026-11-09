import { Express } from 'express'
import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'
import appPromise from '../../../app'
import {
  PermissionController,
  PermissionSettingForRoute,
  PermissionType,
  PrincipalType,
  UserController
} from '../../../controllers/'
import { generateAccessToken, saveTokensInDB } from '../../../utils'

const clientId = 'someclientID'

/**
 * What is registered under one app name.
 *
 * The landing page answers "which apps may I open"; this answers "what is
 * deployed at this name right now", which is what a deploy script and an
 * operator ask. Decided by the same grant rule as the listing: an app a caller
 * may not open is not describable, and the answer is 404 rather than 403
 * because the name's existence is itself information the caller has no grant on.
 */
describe('App Stream app detail', () => {
  let app: Express
  let con: Mongoose
  let mongoServer: MongoMemoryServer
  const userController = new UserController()
  const permissionController = new PermissionController()

  const admin = {
    displayName: 'Test Admin',
    username: 'detailAdmin',
    password: 'adminPassword',
    isAdmin: true,
    isActive: true
  }

  const detailUser = {
    displayName: 'Detail User',
    username: 'detailUser',
    password: 'userPassword',
    isAdmin: false,
    isActive: true
  }

  const tokenFor = async (username: string) => {
    const user = await userController.getUserByUsername(
      { user: { isAdmin: false } } as any,
      username
    )
    const token = generateAccessToken({ clientId, userId: user.uid })
    await saveTokensInDB(user.uid, clientId, token, 'refreshToken')

    return { token, uid: user.uid }
  }

  const grant = (path: string, principalId: string) =>
    permissionController.createPermission({
      path,
      type: PermissionType.route,
      setting: PermissionSettingForRoute.grant,
      principalType: PrincipalType.user,
      principalId
    })

  beforeAll(async () => {
    app = await appPromise

    mongoServer = await MongoMemoryServer.create()
    con = await mongoose.connect(mongoServer.getUri())

    await userController.createUser(admin)
    await userController.createUser(detailUser)

    process.appStreamConfig = {
      Mario: {
        appLoc: '/Public/app/mario',
        streamWebFolder: 'web',
        streamLogo: 'logo.png',
        publishedAt: '2026-11-01T10:00:00.000Z',
        frameAncestors: 'https://portal.example.com'
      },
      Sonic: {
        appLoc: '/Public/app/sonic',
        streamWebFolder: 'web'
      }
    }
  })

  afterAll(async () => {
    process.appStreamConfig = {}

    await con.connection.dropDatabase()
    await con.connection.close()
    await mongoServer.stop()
  })

  afterEach(async () => {
    await con.connection.collection('permissions').deleteMany({})
  })

  it('should respond with Unauthorized when the access token is absent', async () => {
    await request(app).get('/SASjsApi/app/Mario').expect(401)
  })

  it('should 404 a name that is not registered', async () => {
    const { token } = await tokenFor(admin.username)

    const res = await request(app)
      .get('/SASjsApi/app/Zelda')
      .auth(token, { type: 'bearer' })
      .expect(404)

    expect(res.body.message).toContain('Zelda')
  })

  it('should answer with the entry as registered', async () => {
    const { token } = await tokenFor(admin.username)

    const res = await request(app)
      .get('/SASjsApi/app/Mario')
      .auth(token, { type: 'bearer' })
      .expect(200)

    expect(res.body).toMatchObject({
      name: 'Mario',
      appLoc: '/Public/app/mario',
      streamWebFolder: 'web',
      streamLogo: 'logo.png',
      frameAncestors: 'https://portal.example.com',
      publishedAt: '2026-11-01T10:00:00.000Z',
      entryFile: 'index.html',
      url: '/app/Mario/'
    })

    // Nothing was deployed for this entry, and it says so rather than reporting
    // a file and a date that do not exist.
    expect(res.body.entryFileExists).toBe(false)
    expect(res.body.lastModified).toBeNull()
  })

  it('should omit what the entry does not set rather than inventing it', async () => {
    const { token } = await tokenFor(admin.username)

    const res = await request(app)
      .get('/SASjsApi/app/Sonic')
      .auth(token, { type: 'bearer' })
      .expect(200)

    expect(res.body.streamLogo).toBeUndefined()
    expect(res.body.frameAncestors).toBeUndefined()
    expect(res.body.publishedAt).toBeNull()
  })

  it('should 404 an app the caller holds no grant on', async () => {
    const { token } = await tokenFor(detailUser.username)

    await request(app)
      .get('/SASjsApi/app/Mario')
      .auth(token, { type: 'bearer' })
      .expect(404)
  })

  it('should describe an app the caller is granted', async () => {
    const { token, uid } = await tokenFor(detailUser.username)

    await grant('/AppStream/Mario', uid)

    const res = await request(app)
      .get('/SASjsApi/app/Mario')
      .auth(token, { type: 'bearer' })
      .expect(200)

    expect(res.body.appLoc).toBe('/Public/app/mario')
  })

  it('should describe every app for a caller granted the stream as a whole', async () => {
    const { token, uid } = await tokenFor(detailUser.username)

    await grant('/AppStream', uid)

    await request(app)
      .get('/SASjsApi/app/Sonic')
      .auth(token, { type: 'bearer' })
      .expect(200)
  })
})
