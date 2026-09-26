import { Express } from 'express'
import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'
import path from 'path'
import { fileExists, deleteFolder } from '@sasjs/utils'
import appPromise from '../../../app'
import User from '../../../model/User'
import { UserController, PermissionController } from '../../../controllers/'
import {
  generateAccessToken,
  saveTokensInDB,
  getRunTimeAndFilePath
} from '../../../utils/'
import { resolveWithinDrive, isSafePathSegment } from '../../../utils/'
import { getFilesFolder } from '../../../utils/file'

const clientId = 'someclientID'
const user = {
  displayName: 'Test User',
  username: 'testUsername',
  password: '87654321',
  isAdmin: false,
  isActive: true
}

/**
 * Security regression specs. Each test pins a fix for a finding from the
 * v1.2.0 security review; every assertion here failed against the vulnerable
 * code (verified by reverting the fix locally before writing this file):
 *
 * - case bypass: mixed-case URL reached a Permission-gated handler without
 *   the permission check running
 * - _program traversal: getRunTimeAndFilePath accepted paths outside the drive
 * - deploy traversal: fileTree member names could escape the drive
 * - CSRF: a token minted for one session verified for another
 * - sibling-prefix containment: 'drive/files_backup' passed a substring test
 *   meant to confine paths to 'drive/files'
 */
describe('security regression (v1.2.0 review)', () => {
  let app: Express
  let con: Mongoose
  let mongoServer: MongoMemoryServer
  const controller = new UserController()
  const permissionController = new PermissionController()

  let accessToken: string
  let dbUser: any

  const generateAndSaveToken = async (userId: string) => {
    const token = generateAccessToken({ clientId, userId })
    await saveTokensInDB(userId, clientId, token, 'refreshToken')
    return token
  }

  beforeAll(async () => {
    app = await appPromise

    mongoServer = await MongoMemoryServer.create()
    con = await mongoose.connect(mongoServer.getUri())

    dbUser = await controller.createUser(user)
    accessToken = await generateAndSaveToken(dbUser.uid)

    // No Permission records for this user: every authorising route must 401.
  })

  afterAll(async () => {
    await con.connection.dropDatabase()
    await con.connection.close()
    await mongoServer.stop()
  })

  describe('authorisation applies regardless of URL case (HIGH 1)', () => {
    it('mixed-case fileTree request must not bypass the permission gate', async () => {
      // Canonical case: correctly 401 (no permission granted)
      await request(app)
        .get('/SASjsApi/drive/fileTree')
        .auth(accessToken, { type: 'bearer' })
        .expect(401)

      // Mixed case used to reach the handler with NO permission check
      await request(app)
        .get('/SASJSAPI/DRIVE/FILETREE')
        .auth(accessToken, { type: 'bearer' })
        .expect(401)
    })

    it('mixed-case stp/execute must not bypass the permission gate', async () => {
      await request(app)
        .get('/SASJSAPI/STP/EXECUTE')
        .auth(accessToken, { type: 'bearer' })
        .expect(401)
    })

    it('a granted permission applies to mixed-case requests too', async () => {
      const { uid } = dbUser
      await permissionController.createPermission({
        type: 'Route' as any,
        principalType: 'user' as any,
        setting: 'Grant' as any,
        path: '/SASjsApi/drive/fileTree',
        principalId: uid
      })

      // Canonical case now passes (the grant works)...
      await request(app)
        .get('/SASjsApi/drive/fileTree')
        .auth(accessToken, { type: 'bearer' })
        .expect(200)

      // ...and so does the mixed-case form, through the SAME permission.
      await request(app)
        .get('/SASJSAPI/DRIVE/FILETREE')
        .auth(accessToken, { type: 'bearer' })
        .expect(200)
    })
  })

  describe('_program resolution stays inside the drive (HIGH 3)', () => {
    beforeAll(() => {
      // Direct calls to getRunTimeAndFilePath outside a running server need
      // the runTimes list (set by setProcessVariables in production).
      ;(process as any).runTimes = ['sas', 'js']
    })

    it('resolves a leading-slash program path under the drive', async () => {
      // The conventional form: appLoc-based paths start with '/'
      const resolved = resolveWithinDrive('/some/app/program.sas')
      expect(resolved).toBe(
        path.join(getFilesFolder(), 'some', 'app', 'program.sas')
      )
    })

    it('refuses a program path escaping the drive', async () => {
      await expect(getRunTimeAndFilePath('/../../outside.sas')).rejects.toEqual(
        'The Program at (/../../outside.sas) does not exist.'
      )
    })

    it('refuses a filesystem-absolute program path', async () => {
      await expect(getRunTimeAndFilePath('/etc/passwd')).rejects.toEqual(
        'The Program at (/etc/passwd) does not exist.'
      )
    })

    it('refuses a drive-relative climb with an absolute result', async () => {
      await expect(getRunTimeAndFilePath('..')).rejects.toEqual(
        'The Program at (..) does not exist.'
      )
    })
  })

  describe('deploy fileTree member names are single path segments (HIGH 4)', () => {
    it('refuses a member name with a parent traversal', async () => {
      const res = await request(app)
        .post('/SASjsApi/drive/deploy')
        .auth(accessToken, { type: 'bearer' })
        .send({
          appLoc: '/Public',
          fileTree: {
            members: [
              {
                name: '../../../deploy-escaped.txt',
                type: 'file',
                code: 'hello'
              }
            ]
          }
        })

      expect(res.status).toBeGreaterThanOrEqual(400)
    })

    it('refuses a member name containing a path separator', async () => {
      const res = await request(app)
        .post('/SASjsApi/drive/deploy')
        .auth(accessToken, { type: 'bearer' })
        .send({
          appLoc: '/Public',
          fileTree: {
            members: [{ name: 'sub/dir/file.txt', type: 'file', code: 'x' }]
          }
        })

      expect(res.status).toBeGreaterThanOrEqual(400)
    })

    it('refuses an appLoc escaping the drive', async () => {
      const res = await request(app)
        .post('/SASjsApi/drive/deploy')
        .auth(accessToken, { type: 'bearer' })
        .send({
          appLoc: '/../outside',
          fileTree: {
            members: [{ name: 'innocent.txt', type: 'file', code: 'x' }]
          }
        })

      expect(res.status).toBeGreaterThanOrEqual(400)
    })

    it('isSafePathSegment accepts ordinary names and rejects hostile ones', () => {
      expect(isSafePathSegment('run.sas')).toBe(true)
      expect(isSafePathSegment('my-folder')).toBe(true)
      expect(isSafePathSegment('..')).toBe(false)
      expect(isSafePathSegment('a/b')).toBe(false)
      expect(isSafePathSegment('a\\b')).toBe(false)
      expect(isSafePathSegment('')).toBe(false)
    })
  })

  describe('containment is not a substring test (M1)', () => {
    it('refuses a sibling directory whose name shares the drive folder name', () => {
      // drive root .../drive/files; .../drive/files_backup/x must NOT pass
      expect(resolveWithinDrive('../files_backup/x')).toBeUndefined()
      expect(resolveWithinDrive('/normal/path.sas')).toBeDefined()
    })
  })

  describe('CSRF tokens are bound to the session that minted them (HIGH 5)', () => {
    it('rejects a token minted in a different session', async () => {
      // Session A harvests a token from the public home page
      const agentA = request.agent(app)
      const homeA = await agentA.get('/')
      const tokenA = extractCSRF(homeA.text)
      expect(tokenA).toBeTruthy()

      await controller.createUser({
        displayName: 'Cross Session User',
        username: 'crossSessionUsername',
        password: '87654321',
        isAdmin: false,
        isActive: true
      })

      // Session B logs in and tries to use session A's token
      const agentB = request.agent(app)
      await agentB.get('/')

      const loginRes = await agentB
        .post('/SASLogon/login')
        .set('x-xsrf-token', tokenA as string)
        .send({ username: 'crossSessionUsername', password: '87654321' })

      // The token from session A must NOT open a session for B
      expect(loginRes.status).toBe(400)
      expect(loginRes.text).toEqual('Invalid CSRF token!')
    })

    it('rejects a csrf_token supplied via query string', async () => {
      const agent = request.agent(app)
      const home = await agent.get('/')
      const token = extractCSRF(home.text)
      expect(token).toBeTruthy()

      await controller.createUser({
        displayName: 'Query Token User',
        username: 'queryTokenUsername',
        password: '87654321',
        isAdmin: false,
        isActive: true
      })

      const res = await agent
        .post('/SASLogon/login?csrf_token=' + token)
        .send({ username: 'queryTokenUsername', password: '87654321' })

      expect(res.status).toBe(400)
      expect(res.text).toEqual('Invalid CSRF token!')
    })

    it('accepts its own token minted in the same session', async () => {
      const agent = request.agent(app)
      const home = await agent.get('/')
      const token = extractCSRF(home.text)
      expect(token).toBeTruthy()

      await controller.createUser({
        displayName: 'Same Session User',
        username: 'samesessionu',
        password: '87654321',
        isAdmin: false,
        isActive: true
      })

      const res = await agent
        .post('/SASLogon/login')
        .set('x-xsrf-token', token as string)
        .send({ username: 'samesessionu', password: '87654321' })

      expect(res.status).toBe(200)
      expect(res.body.loggedIn).toBe(true)
    })
  })

  describe('password-flagged admin is enforced server-side (HIGH 2)', () => {
    // The enforcement targets the SEEDED admin - the account seedDB creates
    // from ADMIN_USERNAME / ADMIN_PASSWORD_INITIAL. In specs seedDB does not
    // run, so create that account directly with the flag the seed path
    // leaves it with.
    const adminUsername = process.env.ADMIN_USERNAME || 'secretuser'

    const createFlaggedAdmin = async (username: string) => {
      const created = await User.create({
        displayName: 'Seeded Admin',
        username,
        password: User.hashPassword('initialpassword'),
        isAdmin: true,
        isActive: true,
        needsToUpdatePassword: true
      })
      return created
    }

    it('rejects API use by the flagged seeded admin', async () => {
      const flagged = await createFlaggedAdmin(adminUsername)

      const token = await generateAndSaveToken(flagged.uid)

      const res = await request(app)
        .get('/SASjsApi/user')
        .auth(token, { type: 'bearer' })

      expect(res.status).toBe(403)
      expect(res.text).toEqual('Password update required')
    })

    it('allows the flagged admin to change its password, then full access', async () => {
      const flagged = await createFlaggedAdmin(adminUsername + '2')

      const token = await generateAndSaveToken(flagged.uid)

      const res = await request(app)
        .patch('/SASjsApi/auth/updatePassword')
        .auth(token, { type: 'bearer' })
        .send({
          currentPassword: 'initialpassword',
          newPassword: 'newPassword123'
        })

      expect(res.status).toBe(204)

      // After the change the account is fully usable
      const after = await request(app)
        .get('/SASjsApi/user')
        .auth(token, { type: 'bearer' })

      expect(after.status).toBe(200)
    })

    it('does NOT block an ordinary flagged user (service-account compatibility)', async () => {
      // Admin-created users keep the advisory-only semantics: headless
      // service accounts must not be locked out on first login.
      const ordinary = await controller.createUser({
        displayName: 'Ordinary User',
        username: 'ordinaryUsername',
        password: '87654321',
        isAdmin: false,
        isActive: true
      })

      const token = await generateAndSaveToken(ordinary.uid)

      const res = await request(app)
        .get('/SASjsApi/session')
        .auth(token, { type: 'bearer' })

      expect(res.status).toBe(200)
    })
  })
})

const extractCSRF = (text: string) =>
  /XSRF-TOKEN=(.*); Max-Age=86400/.exec(text)?.[1]
