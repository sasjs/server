/**
 * Who may reach the emulated estate, decided by this server's own rules.
 *
 * The estate is mounted at `/`, and it runs caller code on this engine, so a
 * Viya path has to be decided exactly as the API path that carries the same
 * capability. Two things had to be true for that, and neither was:
 *
 * - the guard has to run the permission gate at all (`authenticateAccessToken`
 *   only chains `authorize` for a path in its inventory, and `/compute` is not
 *   in it);
 * - the gate has to know the TOP-LEVEL route, which it derives from
 *   `req.baseUrl`. A router mounted at `/` leaves `baseUrl` empty, so the top
 *   level was `''`: a Grant on `/SASjsApi` was refused on every Viya path, and a
 *   Deny on `/SASjsApi` did not deny the Viya path that runs the same code.
 *
 * These cases run the real wiring - `setupRoutes`, the real token middleware,
 * the real gate, real permission records - because a harness that decides the
 * grant itself would agree with whatever the code does.
 */
import express, { Express } from 'express'
import { mkdtemp } from 'fs/promises'
import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { tmpdir } from 'os'
import { join } from 'path'
import request from 'supertest'

import Group from '../../../model/Group'
import User from '../../../model/User'
import { ModeType, SECRETS } from '../../../utils'
import { generateAccessToken, saveTokensInDB } from '../../../utils/'
import {
  PermissionController,
  PermissionSettingForRoute,
  PermissionType,
  PrincipalType,
  UserController
} from '../../../controllers/'

const clientId = 'viyaClientID'

describe('who may reach the emulated estate', () => {
  let app: Express
  let con: Mongoose
  let mongoServer: MongoMemoryServer
  const userController = new UserController()
  const permissionController = new PermissionController()

  const ungranted = {
    displayName: 'Viya Ungranted',
    username: 'viyaungranted',
    password: 'userPassword',
    isAdmin: false,
    isActive: true
  }

  const topGranted = {
    displayName: 'Viya Top Granted',
    username: 'viyatopgranted',
    password: 'userPassword',
    isAdmin: false,
    isActive: true
  }

  const topDenied = {
    displayName: 'Viya Top Denied',
    username: 'viyatopdenied',
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
    principalType: PrincipalType,
    principalId: string,
    setting = PermissionSettingForRoute.grant
  ) =>
    permissionController.createPermission({
      path,
      type: PermissionType.route,
      setting,
      principalType,
      principalId
    })

  let ungrantedToken: string
  let topGrantedToken: string
  let topDeniedToken: string

  beforeAll(async () => {
    // what the server sets at boot, before `setupRoutes` reads them
    const root = await mkdtemp(join(tmpdir(), 'viya-access-'))

    process.sasjsRoot = root
    process.driveLoc = join(root, 'drive')
    process.logsLoc = join(root, 'logs')
    process.env.MODE = ModeType.Server
    process.env.EMULATE_VIYA = 'true'

    // what `setProcessVariables` installs at boot: the token this suite mints is
    // signed with it, and the middleware verifies it with the same
    process.secrets = SECRETS

    mongoServer = await MongoMemoryServer.create()
    con = await mongoose.connect(mongoServer.getUri())

    await userController.createUser(ungranted)
    await userController.createUser(topGranted)
    await userController.createUser(topDenied)

    ungrantedToken = (await tokenFor(ungranted.username)).token

    const granted = await tokenFor(topGranted.username)
    topGrantedToken = granted.token

    const denied = await tokenFor(topDenied.username)
    topDeniedToken = denied.token

    const group = await Group.create({
      name: 'viya-code-runners',
      description: 'granted the code route as a group',
      isActive: true
    })

    await group.addUser((await User.findById(denied.uid))!)

    await rule('/SASjsApi', PrincipalType.user, granted.uid)

    // the group grant alone would admit the run; the user's Deny on the top
    // level must still refuse it, on the Viya path as on the API path
    await rule('/SASjsApi/code/execute', PrincipalType.group, group.uid)
    await rule(
      '/SASjsApi',
      PrincipalType.user,
      denied.uid,
      PermissionSettingForRoute.deny
    )

    const server = express()
    const { setupRoutes } = await import('../../setupRoutes')

    await setupRoutes(server)
    app = server
  })

  afterAll(async () => {
    await con.connection.dropDatabase()
    await con.connection.close()
    await mongoServer.stop()
  })

  it('refuses a caller with no token at all', async () => {
    // the estate runs submitted programs on this engine, so it is behind the
    // same middleware as `/code`
    await request(app).post('/compute/contexts/x/sessions').expect(401)
  })

  it('refuses a signed-in caller who holds no grant', async () => {
    // `authenticateAccessToken` alone would admit this caller: `/compute` is in
    // no route inventory, so only the guard's explicit gate refuses them
    await request(app)
      .post('/compute/sessions/x/jobs')
      .auth(ungrantedToken, { type: 'bearer' })
      .expect(401)

    await request(app)
      .put('/files/files/abc/content')
      .auth(ungrantedToken, { type: 'bearer' })
      .expect(401)
  })

  it('admits a caller granted the top-level route, on a Viya path', async () => {
    const answer = await request(app)
      .post('/compute/sessions/x/jobs')
      .auth(topGrantedToken, { type: 'bearer' })
      .send({})

    // the gate let it through: the answer is the emulator's, and a session id
    // of `x` is not one it holds
    expect(answer.status).toBe(404)
  })

  it('refuses a caller whose top-level route is denied, on a Viya path', async () => {
    const answer = await request(app)
      .post('/compute/sessions/x/jobs')
      .auth(topDeniedToken, { type: 'bearer' })
      .send({})

    expect(answer.status).toBe(401)
  })

  it('decides a Viya path as the API path it stands for', async () => {
    // the same capability under both names, so the same answer: a deny that
    // blocks `POST /SASjsApi/code/execute` must block the Viya job submission
    const viya = await request(app)
      .post('/compute/sessions/x/jobs')
      .auth(topDeniedToken, { type: 'bearer' })
      .send({})

    const api = await request(app)
      .post('/SASjsApi/code/execute')
      .auth(topDeniedToken, { type: 'bearer' })
      .send({})

    expect(viya.status).toBe(api.status)
    expect(api.status).toBe(401)
  })
})
