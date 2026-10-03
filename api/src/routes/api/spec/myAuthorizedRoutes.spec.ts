import { Express } from 'express'
import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'
import appPromise from '../../../app'
import {
  InfoController,
  PermissionController,
  PermissionSettingForRoute,
  PermissionType,
  PrincipalType,
  UserController
} from '../../../controllers/'
import {
  generateAccessToken,
  getAuthorizedRoutes,
  ModeType,
  saveTokensInDB
} from '../../../utils/'
import Group, { PUBLIC_GROUP_NAME } from '../../../model/Group'
import User from '../../../model/User'

const clientId = 'someclientID'

/**
 * What the web interface reads to hide the entries this caller cannot use.
 *
 * It has to agree with the gate, because a route the interface offers and the
 * gate refuses is the dead end the interface exists to avoid - both read the
 * decision from `routeAccess`, and this pins the shape the interface consumes.
 */
describe('GET /SASjsApi/info/myAuthorizedRoutes', () => {
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

  const plainUser = {
    displayName: 'Plain User',
    username: 'plainUsername',
    password: 'userPassword',
    isAdmin: false,
    isActive: true
  }

  const groupedUser = {
    displayName: 'Grouped User',
    username: 'groupedUsername',
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

  const grantToUser = (
    path: string,
    principalId: string,
    setting: PermissionSettingForRoute
  ) =>
    permissionController.createPermission({
      path,
      type: PermissionType.route,
      setting,
      principalType: PrincipalType.user,
      principalId
    })

  beforeAll(async () => {
    app = await appPromise

    mongoServer = await MongoMemoryServer.create()
    con = await mongoose.connect(mongoServer.getUri())

    await userController.createUser(admin)
    await userController.createUser(plainUser)
    await userController.createUser(groupedUser)
  })

  afterAll(async () => {
    await con.connection.dropDatabase()
    await con.connection.close()
    await mongoServer.stop()
  })

  afterEach(async () => {
    await Group.deleteMany({})
    await con.connection.collection('permissions').deleteMany({})
  })

  it('should respond with Unauthorized when access token is not present', async () => {
    const res = await request(app)
      .get('/SASjsApi/info/myAuthorizedRoutes')
      .expect(401)

    expect(res.text).toEqual('Unauthorized')
  })

  it('should hold nothing but the always-visible routes for a caller with no rules', async () => {
    const { token } = await tokenFor(plainUser.username)

    const res = await request(app)
      .get('/SASjsApi/info/myAuthorizedRoutes')
      .auth(token, { type: 'bearer' })
      .expect(200)

    // Access denies by default, so nothing is held - except the App Stream
    // landing page, which any signed-in caller can reach.
    expect(res.body.paths).toEqual(['/AppStream'])
  })

  it('should hold the routes granted to the caller and nothing else', async () => {
    const { token, uid } = await tokenFor(plainUser.username)

    await grantToUser(
      '/SASjsApi/code/execute',
      uid,
      PermissionSettingForRoute.grant
    )
    await grantToUser(
      '/SASjsApi/drive/file',
      uid,
      PermissionSettingForRoute.deny
    )

    const res = await request(app)
      .get('/SASjsApi/info/myAuthorizedRoutes')
      .auth(token, { type: 'bearer' })
      .expect(200)

    // The granted route is offered; the denied one is not, and neither is
    // anything the caller holds no rule for.
    expect(res.body.paths).toEqual(['/AppStream', '/SASjsApi/code/execute'])
  })

  it('should hold a route granted to a group the caller belongs to', async () => {
    const { token, uid } = await tokenFor(groupedUser.username)

    const group = await Group.create({
      name: 'SomeGroup',
      description: 'A group',
      isActive: true
    })

    // Through the model method, which is what maintains both sides of a
    // membership - the group's `users` and the user's `groups`, and it is the
    // user's side that the rules are resolved against.
    const dbUser = await User.findById(uid)
    await group.addUser(dbUser!)

    await permissionController.createPermission({
      path: '/SASjsApi/stp/execute',
      type: PermissionType.route,
      setting: PermissionSettingForRoute.grant,
      principalType: PrincipalType.group,
      principalId: group.uid
    })

    const res = await request(app)
      .get('/SASjsApi/info/myAuthorizedRoutes')
      .auth(token, { type: 'bearer' })
      .expect(200)

    expect(res.body.paths).toEqual(['/AppStream', '/SASjsApi/stp/execute'])
  })

  it('should hold a route granted to the reserved public group, for everyone', async () => {
    const { token } = await tokenFor(plainUser.username)

    const publicGroup = await Group.create({
      name: PUBLIC_GROUP_NAME,
      description: 'Public',
      isActive: true,
      users: []
    })

    await permissionController.createPermission({
      path: '/SASjsApi/drive/folder',
      type: PermissionType.route,
      setting: PermissionSettingForRoute.grant,
      principalType: PrincipalType.group,
      principalId: publicGroup.uid
    })

    const res = await request(app)
      .get('/SASjsApi/info/myAuthorizedRoutes')
      .auth(token, { type: 'bearer' })
      .expect(200)

    expect(res.body.paths).toEqual(['/AppStream', '/SASjsApi/drive/folder'])
  })

  it('should hold every route for an admin, because the rules do not apply to them', async () => {
    const { token } = await tokenFor(admin.username)

    const res = await request(app)
      .get('/SASjsApi/info/myAuthorizedRoutes')
      .auth(token, { type: 'bearer' })
      .expect(200)

    expect(res.body.paths).toEqual(getAuthorizedRoutes())
  })

  it('should hold every route in desktop mode, which has no rules to resolve', async () => {
    const previousMode = process.env.MODE
    process.env.MODE = ModeType.Desktop

    try {
      // Desktop mode runs as one fixed user with no permission model, so the
      // answer comes from the controller rather than from a lookup. The
      // interface reads this to decide what to offer, so an empty answer hides
      // everything - which is what happened before this branch existed.
      const response = await new InfoController().myAuthorizedRoutes({} as any)

      expect(response.paths).toEqual(getAuthorizedRoutes())
    } finally {
      process.env.MODE = previousMode
    }
  })
})
