import path from 'path'
import { Express } from 'express'
import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'
import {
  UserController,
  PermissionController,
  PermissionType,
  PermissionSettingForRoute,
  PrincipalType
} from '../../../controllers/'
import {
  generateAccessToken,
  saveTokensInDB,
  RunTimeType
} from '../../../utils'

// Real, unmocked end-to-end test of the SAS execution pipeline (session
// spawn -> autoexec handshake -> exit code -> HTTP response), using a fake
// "SAS executable" (mockSas.js) in place of a real SAS install. This is the
// regression test for issue #388: SAS code that aborts (%abort;) used to
// hang the request forever instead of returning an error response.
const mockSasPath = path.join(__dirname, 'files', 'mockSas.js')

const clientId = 'codeSpecClientID'

const user = {
  displayName: 'Code Spec User',
  username: 'codeSpecUsername',
  password: '87654321',
  isAdmin: false,
  isActive: true
}

let app: Express
let accessToken: string

describe('code', () => {
  let con: Mongoose
  let mongoServer: MongoMemoryServer
  let userController: UserController
  let permissionController: PermissionController

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create()
    process.env.DB_CONNECT = mongoServer.getUri()
    process.env.MODE = 'server'
    process.env.RUN_TIMES = 'sas'
    process.env.SAS_PATH = mockSasPath

    const appPromise = (await import('../../../app')).default
    app = await appPromise

    con = await mongoose.connect(mongoServer.getUri())

    userController = new UserController()
    permissionController = new PermissionController()

    const dbUser = await userController.createUser(user)
    accessToken = await generateAndSaveToken(dbUser.id)

    await permissionController.createPermission({
      path: '/SASjsApi/code/execute',
      type: PermissionType.route,
      principalType: PrincipalType.user,
      principalId: dbUser.id,
      setting: PermissionSettingForRoute.grant
    })

    process.runTimes = [RunTimeType.SAS]
    process.sasLoc = mockSasPath
  }, 30000)

  afterAll(async () => {
    await con.connection.dropDatabase()
    await con.connection.close()
    await mongoServer.stop()
  })

  describe('execute', () => {
    it('returns 200 with the mock log when the SAS program completes normally', async () => {
      const response = await request(app)
        .post('/SASjsApi/code/execute')
        .auth(accessToken, { type: 'bearer' })
        .send({ code: '%put hello world;', runTime: 'sas' })
        .expect(200)

      expect(response.text).toEqual(
        expect.stringContaining('mock SAS execution')
      )
    }, 30000)

    it('returns a prompt 400 (not a hang) with the complete log when the SAS session fails (%abort;)', async () => {
      const response = await request(app)
        .post('/SASjsApi/code/execute')
        .auth(accessToken, { type: 'bearer' })
        .send({ code: '%abort;', runTime: 'sas' })
        .expect(400)

      expect(response.body).toMatchObject({
        status: 'failure',
        message: 'Job execution failed.'
      })
      expect(response.body.log).toEqual(
        expect.stringContaining('mock SAS execution')
      )
    }, 30000)
  })
})

const generateAndSaveToken = async (userId: number) => {
  const accessToken = generateAccessToken({
    clientId,
    userId
  })
  await saveTokensInDB(userId, clientId, accessToken, 'refreshToken')
  return accessToken
}
