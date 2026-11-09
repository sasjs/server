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
import { generateAccessToken, saveTokensInDB } from '../../../utils/'

const clientId = 'someclientID'

/**
 * The permission gate has to give the same answer on the short prefix as on the
 * canonical one.
 *
 * This is the case a unit test of `getPath` misses: Express records the prefix
 * the CLIENT used in `req.baseUrl`, but the gate runs on the SUB-mounted routers,
 * so by then `baseUrl` is `/api/code` rather than `/api`. A canonicalisation
 * that only matched the whole string therefore produced `/api/code/execute`,
 * matched no route in the inventory, and made `isAuthorizingRoute` false - which
 * is not "no permission needed", it is "skip the permission check entirely".
 * Every route in StaticAuthorizedRoutes was then reachable on the alias with
 * authentication alone.
 *
 * The assertion is the status the gate itself sends (401), because the code
 * route's controller answers 400 to an empty body: a call that reaches the
 * controller is a call the gate let through, whatever the controller says.
 */
describe('the permission gate on the /api and /app aliases', () => {
  let app: Express
  let con: Mongoose
  let mongoServer: MongoMemoryServer
  const userController = new UserController()
  const permissionController = new PermissionController()

  const admin = {
    displayName: 'Alias Admin',
    username: 'aliasadmin',
    password: 'adminPassword',
    isAdmin: true,
    isActive: true
  }

  const plainUser = {
    displayName: 'Alias Plain User',
    username: 'aliasplain',
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

  const grant = (
    path: string,
    principalId: string,
    setting = PermissionSettingForRoute.grant
  ) =>
    permissionController.createPermission({
      path,
      type: PermissionType.route,
      setting,
      principalType: PrincipalType.user,
      principalId
    })

  let plainToken: string
  let plainUid: string

  beforeAll(async () => {
    app = await appPromise

    mongoServer = await MongoMemoryServer.create()
    con = await mongoose.connect(mongoServer.getUri())

    await userController.createUser(admin)
    await userController.createUser(plainUser)

    const plain = await tokenFor(plainUser.username)
    plainToken = plain.token
    plainUid = plain.uid
  })

  afterAll(async () => {
    await con.connection.dropDatabase()
    await con.connection.close()
    await mongoServer.stop()
  })

  it('refuses a caller with no grant, on the canonical prefix', async () => {
    await request(app)
      .post('/SASjsApi/code/execute')
      .auth(plainToken, { type: 'bearer' })
      .send({})
      .expect(401)
  })

  it('refuses a caller with no grant, on the /api alias', async () => {
    await request(app)
      .post('/api/code/execute')
      .auth(plainToken, { type: 'bearer' })
      .send({})
      .expect(401)
  })

  it('refuses a caller with no grant on a drive route, on the /api alias', async () => {
    // A different sub-mount, so the canonicalisation cannot be right for the
    // code router by accident.
    await request(app)
      .get('/api/drive/folder?_path=/')
      .auth(plainToken, { type: 'bearer' })
      .expect(401)
  })

  it('admits a caller holding the grant, on the /api alias', async () => {
    await grant('/SASjsApi/code/execute', plainUid)

    const response = await request(app)
      .post('/api/code/execute')
      .auth(plainToken, { type: 'bearer' })
      .send({})

    // The gate let it through: the answer is the controller's validation
    // refusal, not the gate's 401.
    expect(response.status).not.toEqual(401)
  })

  it('answers the same on both spellings for a route with no gate', async () => {
    // Authenticated is enough for /info; this pins that the alias has not
    // started refusing what the canonical spelling admits.
    const aliased = await request(app)
      .get('/api/info')
      .auth(plainToken, { type: 'bearer' })

    const canonical = await request(app)
      .get('/SASjsApi/info')
      .auth(plainToken, { type: 'bearer' })

    expect(aliased.status).toEqual(200)
    expect(aliased.body).toEqual(canonical.body)
  })
})
