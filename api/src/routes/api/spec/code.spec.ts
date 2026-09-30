import path from 'path'
import { createFile, fileExists } from '@sasjs/utils'
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
  RunTimeType,
  sysInitCompiledPath
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
    // SASSessionController.createSession() unconditionally reads this file
    // (Session.ts:105) before it ever spawns the SAS process. It's normally
    // produced by `npm run compileSysInit` (part of the `initial`/`build`
    // scripts), which `npm test` does not run - so on a fresh checkout
    // (e.g. CI, where "Run Unit Tests" happens before "Build Package") it
    // doesn't exist yet. Content is irrelevant here since mockSas.js never
    // interprets it; it just needs to exist and be readable.
    if (!(await fileExists(sysInitCompiledPath))) {
      await createFile(sysInitCompiledPath, '')
    }

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
    accessToken = await generateAndSaveToken(dbUser.uid)

    await permissionController.createPermission({
      path: '/SASjsApi/code/execute',
      type: PermissionType.route,
      principalType: PrincipalType.user,
      principalId: dbUser.uid,
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

    // A failed SAS session (e.g. %abort;) is a normal outcome of running
    // arbitrary user code, not a request-shape/server problem - the HTTP
    // request itself was fine, so this must respond exactly like a
    // successful run (200, same body shape, no hang), with the log simply
    // reflecting what happened. Regression test for #388's follow-up: the
    // original #388 fix stopped the hang but over-corrected into a 400
    // with a bespoke error shape, which broke Studio's log-tab rendering.
    it('returns 200 with the same shape as a successful run when the SAS session fails (%abort;), not a hang or an error shape', async () => {
      const response = await request(app)
        .post('/SASjsApi/code/execute')
        .auth(accessToken, { type: 'bearer' })
        .send({ code: '%abort;', runTime: 'sas' })
        .expect(200)

      expect(response.text).toEqual(
        expect.stringContaining('mock SAS execution')
      )
      expect(response.text).toEqual(
        expect.stringContaining('SAS session terminated')
      )
    }, 30000)
  })

  describe('lint', () => {
    // The caller here holds a grant for /SASjsApi/code/execute and nothing
    // else. Lint needs no grant of its own: it neither reads a file nor runs
    // anything, it analyses the text the caller submitted.
    it('returns the diagnostics for the submitted code', async () => {
      const response = await request(app)
        .post('/SASjsApi/code/lint')
        .auth(accessToken, { type: 'bearer' })
        .send({ code: 'data _null_;\n  x = 1; \nrun;' })
        .expect(200)

      expect(Array.isArray(response.body)).toEqual(true)

      // Line 2 is '  x = 1; ' - the trailing space is the violation.
      expect(response.body).toContainEqual({
        message: 'Line contains trailing spaces',
        lineNumber: 2,
        startColumnNumber: 9,
        endColumnNumber: 9,
        severity: 1
      })
    })

    it('returns 400 when the code is missing', async () => {
      const response = await request(app)
        .post('/SASjsApi/code/lint')
        .auth(accessToken, { type: 'bearer' })
        .send({})
        .expect(400)

      expect(response.text).toEqual('"code" is required')
    })

    it('returns 401 without an access token', async () => {
      const response = await request(app)
        .post('/SASjsApi/code/lint')
        .send({ code: 'data _null_;\nrun;' })
        .expect(401)

      expect(response.text).toEqual('Unauthorized')
    })
  })

  describe('format', () => {
    // Like lint, format needs no grant of its own: it neither reads a file
    // nor runs anything, it rewrites the text the caller submitted.
    it('returns the formatted text for the submitted code', async () => {
      const response = await request(app)
        .post('/SASjsApi/code/format')
        .auth(accessToken, { type: 'bearer' })
        .send({ code: 'data _null_;\n  x = 1; \nrun;' })
        .expect(200)

      expect(typeof response.body).toEqual('string')

      // The trailing space on line 2 is removed by the noTrailingSpaces fix.
      expect(response.body).not.toContain('x = 1; \n')
      expect(response.body).toContain('x = 1;\n')
    })

    it('returns 400 when the code is missing', async () => {
      const response = await request(app)
        .post('/SASjsApi/code/format')
        .auth(accessToken, { type: 'bearer' })
        .send({})
        .expect(400)

      expect(response.text).toEqual('"code" is required')
    })

    it('returns 401 without an access token', async () => {
      const response = await request(app)
        .post('/SASjsApi/code/format')
        .send({ code: 'data _null_;\nrun;' })
        .expect(401)

      expect(response.text).toEqual('Unauthorized')
    })
  })
})

const generateAndSaveToken = async (userId: string) => {
  const accessToken = generateAccessToken({
    clientId,
    userId
  })
  await saveTokensInDB(userId, clientId, accessToken, 'refreshToken')
  return accessToken
}
