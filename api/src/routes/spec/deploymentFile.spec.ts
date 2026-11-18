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

  it('answers the SASjs tier spelling - what a SASjs build links to', async () => {
    const { token } = await tokenFor(admin.username)

    const res = await request(app)
      .get(`/StoredProgram?_FILE=${assetPath}`)
      .auth(token, { type: 'bearer' })
      .expect(200)

    expect(res.headers['content-type']).toContain('javascript')
    expect(res.text).toEqual('console.log("streamed")')
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

  it('accepts mixed-case and percent-encoded file keys on both tiers', async () => {
    const { token } = await tokenFor(admin.username)

    for (const tier of ['/StoredProgram', '/SASJobExecution']) {
      for (const key of ['_file', '_FiLe', '%5fFi%4Ce']) {
        const res = await request(app)
          .get(`${tier}?${key}=${assetPath}`)
          .auth(token, { type: 'bearer' })
          .expect(200)
        expect(res.text).toEqual('console.log("streamed")')
      }
    }
  })

  it('rejects repeated file names like the direct API, including mixed spellings', async () => {
    const { token } = await tokenFor(admin.username)
    const direct = await request(app)
      .get(`/SASjsApi/drive/file?_FILE=/missing.js&_FILE=${assetPath}`)
      .auth(token, { type: 'bearer' })
      .expect(400)
    for (const tier of ['/StoredProgram', '/SASJobExecution']) {
      for (const query of [
        `_FILE=/missing.js&_FILE=${assetPath}`,
        `_FILE=/missing.js&_file=${assetPath}`,
        `_file=${assetPath}&%5fFILE=/missing.js`
      ]) {
        const res = await request(app)
          .get(`${tier}?${query}`)
          .auth(token, { type: 'bearer' })
          .expect(400)
        expect(res.text).toEqual(direct.text)
      }
      await request(app).get(`${tier}?_FILE=a&_file=b`).expect(401)
    }
  })

  it('refuses mixed-case file and filepath even with repeats or empty values', async () => {
    const { token } = await tokenFor(admin.username)
    for (const tier of ['/StoredProgram', '/SASJobExecution']) {
      for (const query of [
        `_file=${assetPath}&%5fFILEPATH=${assetPath}`,
        `_FILE=${assetPath}&_filepath=`,
        `_filePath=${assetPath}&_FILEPATH=${assetPath}&_fIlE=${assetPath}`
      ]) {
        const res = await request(app)
          .get(`${tier}?${query}`)
          .auth(token, { type: 'bearer' })
          .expect(400)
        expect(res.text).toEqual(
          'Exactly one of "_filePath" and "_FILE" may be given.'
        )
      }
    }
  })

  it('applies authentication, authorization and traversal checks to mixed-case files', async () => {
    const { token: adminToken } = await tokenFor(admin.username)
    const { token: userToken } = await tokenFor(streamUser.username)
    for (const tier of ['/StoredProgram', '/SASJobExecution']) {
      await request(app).get(`${tier}?_file=${assetPath}`).expect(401)
      await request(app)
        .get(`${tier}?_FiLe=${assetPath}`)
        .auth(userToken, { type: 'bearer' })
        .expect(401)
      await request(app)
        .get(`${tier}?_file=../../etc/passwd`)
        .auth(adminToken, { type: 'bearer' })
        .expect(400)
    }
  })

  it('answers a missing file the way the estate does', async () => {
    const { token } = await tokenFor(admin.username)

    const res = await request(app)
      .get('/SASJobExecution?_FILE=/Public/app/services/web/not-here.js')
      .auth(token, { type: 'bearer' })
      .expect(202)

    expect(res.text).toEqual(DEPLOYMENT_FILE_ERROR)
  })

  it('refuses a request that names the file twice, on either spelling', async () => {
    const { token } = await tokenFor(admin.username)

    // the two names answer differently - typed, and bytes - so a request
    // carrying both is a caller disagreeing with itself rather than a file to
    // pick for it
    for (const path of [
      `/SASjsApi/drive/file?_FILE=${assetPath}&_filePath=${assetPath}`,
      `/SASJobExecution?_FILE=${assetPath}&_filePath=${assetPath}`,
      `/StoredProgram?_FILE=${assetPath}&_filePath=${assetPath}`
    ]) {
      const res = await request(app)
        .get(path)
        .auth(token, { type: 'bearer' })
        .expect(400)

      expect(res.text).toEqual(
        'Exactly one of "_filePath" and "_FILE" may be given.'
      )
    }
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
