import path from 'path'
import { Express } from 'express'
import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'
import * as fileUtilModules from '../../../utils/file'

// The index is a file beside the drive. Isolated here, or every suite that
// publishes would share (and race over) one appStreamConfig.json.
const tmpFolder = path.join(process.cwd(), `tmp-app-detail-${process.pid}`)

jest
  .spyOn(fileUtilModules, 'getAppStreamConfigPath')
  .mockImplementation(() => path.join(tmpFolder, 'appStreamConfig.json'))
jest
  .spyOn(fileUtilModules, 'getFilesFolder')
  .mockImplementation(() => path.join(tmpFolder, 'files'))

import appPromise from '../../../app'
import {
  AppController,
  PermissionController,
  PermissionSettingForRoute,
  PermissionType,
  PrincipalType,
  UserController
} from '../../../controllers/'
import {
  generateAccessToken,
  refreshAppStreamIndex,
  saveTokensInDB,
  writeStoredAppStreamEntries
} from '../../../utils'

const clientId = 'someclientID'

/** The two apps every case starts from, with stated ids so a case can name one. */
const MARIO = '0b9a1c2d-3e4f-4a5b-8c6d-7e8f9a0b1c2d'
const SONIC = 'f1e2d3c4-b5a6-4c7d-8e9f-0a1b2c3d4e5f'

/**
 * What is published under one app id.
 *
 * The landing page answers "which apps may I open"; this answers "what is
 * deployed at this id right now", which is what a deploy script and an operator
 * ask. A publish answers with the id, and the app's own URL carries it, so that
 * is the handle - a label is shared by design and is not looked up here.
 *
 * Decided by the same grant rule as the listing: an app a caller may not open is
 * not describable, and the answer is 404 rather than 403 because the id's
 * existence is itself information the caller has no grant on.
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

    // The index as a publish would leave it: two apps, each with the id it was
    // minted. Written through the store, because the file IS the registry.
    await writeStoredAppStreamEntries([
      {
        id: MARIO,
        name: 'Mario',
        appLoc: '/Public/app/mario',
        streamWebFolder: 'web',
        logo: 'logo.png',
        publishedAt: '2026-11-01T10:00:00.000Z',
        frameAncestors: ['https://portal.example.com']
      },
      {
        id: SONIC,
        name: 'Sonic',
        appLoc: '/Public/app/sonic',
        streamWebFolder: 'web',
        publishedAt: '2026-11-02T10:00:00.000Z'
      }
    ])

    await refreshAppStreamIndex()
  })

  afterAll(async () => {
    await writeStoredAppStreamEntries([])
    await refreshAppStreamIndex()

    await con.connection.dropDatabase()
    await con.connection.close()
    await mongoServer.stop()
  })

  afterEach(async () => {
    await con.connection.collection('permissions').deleteMany({})
  })

  it('should respond with Unauthorized when the access token is absent', async () => {
    await request(app).get(`/SASjsApi/app/${MARIO}`).expect(401)
  })

  it('should 404 an id that is not registered', async () => {
    const { token } = await tokenFor(admin.username)

    const res = await request(app)
      .get('/SASjsApi/app/9a9a9a9a-9a9a-4a9a-8a9a-9a9a9a9a9a9a')
      .auth(token, { type: 'bearer' })
      .expect(404)

    expect(res.body.message).toContain('that id')
  })

  it('should answer 500 with the fixed envelope when the controller throws', async () => {
    // The route sends the same { status, message } shape for every refusal, so a
    // client parses one thing - and a 5xx carries no library message, because a
    // driver's text is nothing a caller can act on and can carry internals. Spied on
    // the controller rather than the store: the store answers an unreadable index with
    // an empty one by design, so there is no file this could be provoked with.
    const spy = jest
      .spyOn(AppController.prototype, 'getApp')
      .mockRejectedValue(new Error('EIO: i/o error, read'))

    try {
      const { token } = await tokenFor(admin.username)

      const res = await request(app)
        .get(`/SASjsApi/app/${MARIO}`)
        .auth(token, { type: 'bearer' })

      expect(res.status).toBe(500)
      expect(res.body).toEqual({
        status: 'failure',
        message: 'Internal Server Error'
      })
      expect(JSON.stringify(res.body)).not.toContain('EIO')
    } finally {
      spy.mockRestore()
    }
  })

  it('should not answer a label in place of an id', async () => {
    const { token } = await tokenFor(admin.username)

    // A label is shared by design, so "the app called Mario" is not one app and
    // this route does not guess which one was meant.
    await request(app)
      .get('/SASjsApi/app/Mario')
      .auth(token, { type: 'bearer' })
      .expect(404)
  })

  it('should answer with the entry as published', async () => {
    const { token } = await tokenFor(admin.username)

    const res = await request(app)
      .get(`/SASjsApi/app/${MARIO}`)
      .auth(token, { type: 'bearer' })
      .expect(200)

    expect(res.body).toMatchObject({
      id: MARIO,
      name: 'Mario',
      appLoc: '/Public/app/mario',
      streamWebFolder: 'web',
      logo: 'logo.png',
      frameAncestors: ['https://portal.example.com'],
      publishedAt: '2026-11-01T10:00:00.000Z',
      entryFile: 'index.html',
      url: `/app/${MARIO}/`
    })

    // Nothing was deployed for this entry, and it says so rather than reporting
    // a file and a date that do not exist.
    expect(res.body.entryFileExists).toBe(false)
    expect(res.body.lastModified).toBeNull()
  })

  it('should omit what the entry does not set rather than inventing it', async () => {
    const { token } = await tokenFor(admin.username)

    const res = await request(app)
      .get(`/SASjsApi/app/${SONIC}`)
      .auth(token, { type: 'bearer' })
      .expect(200)

    expect(res.body.logo).toBeUndefined()
    expect(res.body.frameAncestors).toBeUndefined()
  })

  it('should 404 an app the caller holds no grant on', async () => {
    const { token } = await tokenFor(detailUser.username)

    await request(app)
      .get(`/SASjsApi/app/${MARIO}`)
      .auth(token, { type: 'bearer' })
      .expect(404)
  })

  it('should describe an app the caller is granted by its id', async () => {
    const { token, uid } = await tokenFor(detailUser.username)

    await grant(`/AppStream/${MARIO}`, uid)

    const res = await request(app)
      .get(`/SASjsApi/app/${MARIO}`)
      .auth(token, { type: 'bearer' })
      .expect(200)

    expect(res.body.appLoc).toBe('/Public/app/mario')
  })

  it('should still honour a grant written before apps had an id', async () => {
    const { token, uid } = await tokenFor(detailUser.username)

    // every rule written against the name-keyed registry looks like this
    await grant('/AppStream/Mario', uid)

    await request(app)
      .get(`/SASjsApi/app/${MARIO}`)
      .auth(token, { type: 'bearer' })
      .expect(200)
  })

  it('should describe every app for a caller granted the stream as a whole', async () => {
    const { token, uid } = await tokenFor(detailUser.username)

    await grant('/AppStream', uid)

    await request(app)
      .get(`/SASjsApi/app/${SONIC}`)
      .auth(token, { type: 'bearer' })
      .expect(200)
  })
})
