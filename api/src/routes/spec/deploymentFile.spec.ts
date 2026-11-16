import path from 'path'
import { createFile, deleteFolder } from '@sasjs/utils'
import { Express } from 'express'
import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'

import * as fileUtilModules from '../../utils/file'

const tmpFolder = path.join(process.cwd(), `tmp-deployment-file-${process.pid}`)
const driveFolder = path.join(tmpFolder, 'files')
const appFolder = path.join(driveFolder, 'Public', 'app', 'services', 'web')

jest
  .spyOn(fileUtilModules, 'getFilesFolder')
  .mockImplementation(() => driveFolder)
jest
  .spyOn(fileUtilModules, 'getAppStreamConfigPath')
  .mockImplementation(() => path.join(tmpFolder, 'appStreamConfig.json'))

import appPromise from '../../app'
import {
  PermissionController,
  PermissionSettingForRoute,
  PermissionType,
  PrincipalType,
  UserController
} from '../../controllers/'
import {
  DEPLOYMENT_FILE_ERROR,
  generateAccessToken,
  saveTokensInDB
} from '../../utils'

const clientId = 'someclientID'

/**
 * The read a streamed deployment links to: one file out of the drive, by the
 * path the build baked into the page.
 *
 * What is pinned here is this host's half of the contract - the file is typed
 * from its extension rather than sent as bytes, a file that is not there
 * answers the way the estate answers, and the Viya spelling of the URL is the
 * same operation under the same permission rule. What the page then does with
 * the bytes is the browser's business.
 */
describe('streamed deployment files', () => {
  let app: Express
  let con: Mongoose
  let mongoServer: MongoMemoryServer
  const userController = new UserController()
  const permissionController = new PermissionController()

  const admin = {
    displayName: 'Test Admin',
    username: 'streamFileAdmin',
    password: 'adminPassword',
    isAdmin: true,
    isActive: true
  }

  const streamUser = {
    displayName: 'Stream User',
    username: 'streamFileUser',
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

  const assetPath = '/Public/app/services/web/main.js'

  beforeAll(async () => {
    app = await appPromise

    mongoServer = await MongoMemoryServer.create()
    con = await mongoose.connect(mongoServer.getUri())

    await userController.createUser(admin)
    await userController.createUser(streamUser)

    // the deployment a streamed build writes: the entry page beside the folder
    // of assets, each asset a file the page names by path
    await createFile(path.join(appFolder, 'main.js'), 'console.log("streamed")')
    await createFile(
      path.join(driveFolder, 'Public', 'app', 'services', 'clickme.html'),
      '<html><script src="/SASJobExecution?_FILE=/Public/app/services/web/main.js"></script></html>'
    )
  })

  afterAll(async () => {
    await deleteFolder(tmpFolder)

    await con.connection.dropDatabase()
    await con.connection.close()
    await mongoServer.stop()
  })

  afterEach(async () => {
    await con.connection.collection('permissions').deleteMany({})
  })

  it('answers 401 without an access token', async () => {
    await request(app)
      .get(`/SASjsApi/drive/file?_FILE=${assetPath}`)
      .expect(401)
  })

  it('serves the file typed by its extension', async () => {
    const { token } = await tokenFor(admin.username)

    const res = await request(app)
      .get(`/SASjsApi/drive/file?_FILE=${assetPath}`)
      .auth(token, { type: 'bearer' })
      .expect(200)

    expect(res.headers['content-type']).toContain('javascript')
    expect(res.text).toEqual('console.log("streamed")')
  })

  it('serves the entry page as HTML, so it renders', async () => {
    const { token } = await tokenFor(admin.username)

    const res = await request(app)
      .get(`/SASjsApi/drive/file?_FILE=/Public/app/services/clickme.html`)
      .auth(token, { type: 'bearer' })
      .expect(200)

    expect(res.headers['content-type']).toContain('text/html')
  })

  it('answers the Viya spelling of the same URL', async () => {
    const { token } = await tokenFor(admin.username)

    const res = await request(app)
      .get(`/SASJobExecution?_FILE=${assetPath}`)
      .auth(token, { type: 'bearer' })
      .expect(200)

    expect(res.headers['content-type']).toContain('javascript')
    expect(res.text).toEqual('console.log("streamed")')
  })

  it('answers a missing file the way the estate does', async () => {
    const { token } = await tokenFor(admin.username)

    const res = await request(app)
      .get('/SASJobExecution?_FILE=/Public/app/services/web/not-here.js')
      .auth(token, { type: 'bearer' })
      .expect(202)

    expect(res.text).toEqual(DEPLOYMENT_FILE_ERROR)
  })

  it('refuses a path that climbs out of the drive', async () => {
    const { token } = await tokenFor(admin.username)

    await request(app)
      .get('/SASjsApi/drive/file?_FILE=../../etc/passwd')
      .auth(token, { type: 'bearer' })
      .expect(400)
  })

  it('decides on the drive file rule, so a caller with no grant reads nothing', async () => {
    const { token } = await tokenFor(streamUser.username)

    await request(app)
      .get(`/SASjsApi/drive/file?_FILE=${assetPath}`)
      .auth(token, { type: 'bearer' })
      .expect(401)
  })

  it('admits a caller granted the file rule - on either spelling', async () => {
    const { token, uid } = await tokenFor(streamUser.username)

    await permissionController.createPermission({
      path: '/SASjsApi/drive/file',
      type: PermissionType.route,
      setting: PermissionSettingForRoute.grant,
      principalType: PrincipalType.user,
      principalId: uid
    })

    await request(app)
      .get(`/SASjsApi/drive/file?_FILE=${assetPath}`)
      .auth(token, { type: 'bearer' })
      .expect(200)

    await request(app)
      .get(`/SASJobExecution?_FILE=${assetPath}`)
      .auth(token, { type: 'bearer' })
      .expect(200)
  })
})
