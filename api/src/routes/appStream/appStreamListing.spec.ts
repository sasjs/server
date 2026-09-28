import { Express } from 'express'
import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'
import appPromise from '../../app'
import {
  PermissionController,
  PermissionSettingForRoute,
  PermissionType,
  PrincipalType,
  UserController
} from '../../controllers/'
import { generateAccessToken, saveTokensInDB } from '../../utils'

const clientId = 'someclientID'

/**
 * The App Stream landing page lists only the apps the caller may open.
 *
 * A tile for an app the caller holds no grant on is a dead end - the app's own
 * route is permissioned, so following it answers 401. The listing and the gate
 * read the same decision (`routeAccess`), so these cases are also the gate's
 * cases.
 */
describe('App Stream listing', () => {
  let app: Express
  let con: Mongoose
  let mongoServer: MongoMemoryServer
  const userController = new UserController()
  const permissionController = new PermissionController()

  const admin = {
    displayName: 'Test Admin',
    username: 'adminUsername',
    password: 'adminPassword',
    isAdmin: true,
    isActive: true
  }

  const streamUser = {
    displayName: 'Stream User',
    username: 'streamUsername',
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

  const rule = (
    path: string,
    setting: PermissionSettingForRoute,
    principalId: string,
    principalType = PrincipalType.user
  ) =>
    permissionController.createPermission({
      path,
      type: PermissionType.route,
      setting,
      principalType,
      principalId
    })

  beforeAll(async () => {
    app = await appPromise

    mongoServer = await MongoMemoryServer.create()
    con = await mongoose.connect(mongoServer.getUri())

    await userController.createUser(admin)
    await userController.createUser(streamUser)

    // Two published apps, which is what puts /AppStream/Mario and
    // /AppStream/Sonic into the permission inventory.
    process.appStreamConfig = {
      Mario: {
        appLoc: '/Public/app/mario',
        streamWebFolder: 'web',
        streamLogo: 'logo.png'
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

  it('should respond with Unauthorized when access token is not present', async () => {
    await request(app).get('/AppStream/').expect(401)
  })

  it('should refuse the page itself to a caller with no grant on it', async () => {
    const { token } = await tokenFor(streamUser.username)

    // The landing page is /AppStream, which is itself in the inventory.
    await request(app)
      .get('/AppStream/')
      .auth(token, { type: 'bearer' })
      .expect(401)
  })

  it('should list every app for an admin', async () => {
    const { token } = await tokenFor(admin.username)

    const res = await request(app)
      .get('/AppStream/')
      .auth(token, { type: 'bearer' })
      .expect(200)

    expect(res.text).toContain('href="Mario"')
    expect(res.text).toContain('href="Sonic"')
  })

  it('should list every app for a caller granted the stream as a whole', async () => {
    const { token, uid } = await tokenFor(streamUser.username)

    await rule('/AppStream', PermissionSettingForRoute.grant, uid)

    const res = await request(app)
      .get('/AppStream/')
      .auth(token, { type: 'bearer' })
      .expect(200)

    expect(res.text).toContain('href="Mario"')
    expect(res.text).toContain('href="Sonic"')
  })

  it('should leave out an app the caller is denied, even while the stream is granted', async () => {
    const { token, uid } = await tokenFor(streamUser.username)

    await rule('/AppStream', PermissionSettingForRoute.grant, uid)
    await rule('/AppStream/Mario', PermissionSettingForRoute.deny, uid)

    const res = await request(app)
      .get('/AppStream/')
      .auth(token, { type: 'bearer' })
      .expect(200)

    // The tile is gone, and the route agrees: following it would answer 401.
    expect(res.text).not.toContain('href="Mario"')
    expect(res.text).toContain('href="Sonic"')

    await request(app)
      .get('/AppStream/Mario/')
      .auth(token, { type: 'bearer' })
      .expect(401)
  })
})
