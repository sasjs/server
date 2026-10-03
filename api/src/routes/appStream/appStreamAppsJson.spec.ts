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
 * `/AppStream/apps.json` is what the single-page app's home screen reads to
 * show the app tiles. It must answer with the same permission-filtered list the
 * landing page renders, or the home screen becomes a way to see (and try) apps
 * the caller holds no grant on.
 */
describe('App Stream listing as JSON', () => {
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
    principalId: string
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
    await userController.createUser(streamUser)

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
    await request(app).get('/AppStream/apps.json').expect(401)
  })

  it('should list nothing for a caller holding no grants', async () => {
    const { token } = await tokenFor(streamUser.username)

    const res = await request(app)
      .get('/AppStream/apps.json')
      .auth(token, { type: 'bearer' })
      .expect(200)

    expect(res.body.apps).toEqual([])
  })

  it('should list only the app the caller is granted, with its location and url', async () => {
    const { token, uid } = await tokenFor(streamUser.username)

    await rule('/AppStream/Mario', PermissionSettingForRoute.grant, uid)

    const res = await request(app)
      .get('/AppStream/apps.json')
      .auth(token, { type: 'bearer' })
      .expect(200)

    expect(res.body.apps).toEqual([
      {
        name: 'Mario',
        appLoc: '/Public/app/mario',
        // A configured logo is an asset inside the app, so it is answered as a
        // URL under the app's stream path - the same way the landing page
        // resolves it. Rendered raw it would resolve against the interface root.
        logo: '/AppStream/Mario/logo.png',
        url: '/AppStream/Mario/'
      }
    ])
  })

  it('should leave out an app the caller is denied, even while the stream is granted', async () => {
    const { token, uid } = await tokenFor(streamUser.username)

    await rule('/AppStream', PermissionSettingForRoute.grant, uid)
    await rule('/AppStream/Mario', PermissionSettingForRoute.deny, uid)

    const res = await request(app)
      .get('/AppStream/apps.json')
      .auth(token, { type: 'bearer' })
      .expect(200)

    expect(res.body.apps.map((a: any) => a.name)).toEqual(['Sonic'])
  })

  it('should list every app for an admin', async () => {
    const { token } = await tokenFor(admin.username)

    const res = await request(app)
      .get('/AppStream/apps.json')
      .auth(token, { type: 'bearer' })
      .expect(200)

    expect(res.body.apps.map((a: any) => a.name).sort()).toEqual([
      'Mario',
      'Sonic'
    ])
  })

  it('should agree with the HTML landing page', async () => {
    const { token, uid } = await tokenFor(streamUser.username)

    await rule('/AppStream/Mario', PermissionSettingForRoute.grant, uid)

    const json = await request(app)
      .get('/AppStream/apps.json')
      .auth(token, { type: 'bearer' })
      .expect(200)

    const html = await request(app)
      .get('/AppStream/')
      .auth(token, { type: 'bearer' })
      .expect(200)

    // The two surfaces read the same decision, so neither may show an app the
    // other hides.
    for (const app of json.body.apps) {
      expect(html.text).toContain(`href="${app.name}"`)
    }
    expect(html.text).not.toContain('href="Sonic"')
  })

  it('should resolve a configured logo the way the landing page does', async () => {
    const { token, uid } = await tokenFor(streamUser.username)

    await rule('/AppStream/Mario', PermissionSettingForRoute.grant, uid)
    await rule('/AppStream/Sonic', PermissionSettingForRoute.grant, uid)

    const json = await request(app)
      .get('/AppStream/apps.json')
      .auth(token, { type: 'bearer' })
      .expect(200)

    const html = await request(app)
      .get('/AppStream/')
      .auth(token, { type: 'bearer' })
      .expect(200)

    const byName = Object.fromEntries(
      json.body.apps.map((app: any) => [app.name, app.logo])
    )

    // Mario configures a logo, which is an asset inside the app - so it is
    // answered under the app's stream path. The page renders the same value
    // relative to its <base href="/AppStream/">.
    expect(byName.Mario).toEqual('/AppStream/Mario/logo.png')
    expect(html.text).toContain('src="Mario/logo.png"')

    // Sonic configures none, and the interface falls back to its own logo.
    expect(byName.Sonic).toBeNull()
  })
})
