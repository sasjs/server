import { Express } from 'express'
import path from 'path'
import os from 'os'
import { writeFile } from 'fs/promises'
import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'
import { createFile, deleteFolder, generateTimestamp } from '@sasjs/utils'

import appPromise from '../../../app'
import { UserController } from '../../../controllers'
import { getSessionController } from '../../../controllers/internal'
import {
  generateAccessToken,
  ModeType,
  RunTimeType,
  saveTokensInDB
} from '../../../utils'
import { desktopUser } from '../../../middlewares/desktop'
import { Session, SessionState } from '../../../types/Session'

/**
 * What the session routes answer now that `@sasjs/api` decides them.
 *
 * `session.spec.ts` is the behaviour this server had before the adoption and it
 * passes unmodified, which is the proof that the move changed nothing a client
 * sees. These are the cases that spec cannot make and the port does:
 *
 * - an owner recorded as a **uid** - the package compares the identifier first
 *   and the username second, so a host whose records carry either reads
 *   correctly. The old implementation compared usernames only and answered a
 *   uid-owned session with a `404` to its own owner.
 * - an `_webout` that is **bytes**, which the port carries as bytes rather than
 *   as text (the artefact shape `sasjs/api#43` introduced).
 * - the `404` wording, which the corpus pins and which the package owns now.
 */
describe('the session routes, over the package', () => {
  let app: Express
  let con: Mongoose
  let mongoServer: MongoMemoryServer
  let sessionRoot: string

  let adminToken: string
  let plainToken: string
  let plainUid: string

  const admin = {
    displayName: 'Test Admin',
    username: 'portAdmin',
    password: 'adminPassword',
    isAdmin: true,
    isActive: true
  }

  const plainUser = {
    displayName: 'Plain User',
    username: 'portPlain',
    password: 'userPassword',
    isAdmin: false,
    isActive: true
  }

  const register = async (
    overrides: Partial<Session>,
    artifacts: {
      log?: string
      webout?: string | Uint8Array
      headers?: string
    } = {}
  ): Promise<Session> => {
    const sessionId = `20241028074744-54132-${generateTimestamp()}-${Math.round(
      Math.random() * 100000
    )}`
    const sessionPath = path.join(sessionRoot, sessionId)

    const session: Session = {
      id: sessionId,
      state: SessionState.completed,
      creationTimeStamp: sessionId.split('-').pop() as string,
      deathTimeStamp: (new Date().getTime() + 60_000).toString(),
      path: sessionPath,
      owner: admin.username,
      ...overrides
    }

    await createFile(path.join(sessionPath, 'log.log'), artifacts.log ?? 'log')

    if (artifacts.webout !== undefined)
      await writeFile(path.join(sessionPath, 'webout.txt'), artifacts.webout)

    await createFile(
      path.join(sessionPath, 'stpsrv_header.txt'),
      artifacts.headers ?? 'content-type: text/html; charset=utf-8'
    )

    const controller = getSessionController(RunTimeType.SAS)
    ;(controller as any).sessions.push(session)

    return session
  }

  beforeAll(async () => {
    app = await appPromise

    mongoServer = await MongoMemoryServer.create()
    con = await mongoose.connect(mongoServer.getUri())

    const users = new UserController()
    await users.createUser(admin)
    await users.createUser(plainUser)

    const adminUser = await users.getUserByUsername(
      { user: { isAdmin: false } } as any,
      admin.username
    )
    adminToken = generateAccessToken({
      clientId: 'someclientID',
      userId: adminUser.uid
    })
    await saveTokensInDB(
      adminUser.uid,
      'someclientID',
      adminToken,
      'refreshToken'
    )

    const plain = await users.getUserByUsername(
      { user: { isAdmin: false } } as any,
      plainUser.username
    )
    plainUid = plain.uid
    plainToken = generateAccessToken({
      clientId: 'someclientID',
      userId: plain.uid
    })
    await saveTokensInDB(plain.uid, 'someclientID', plainToken, 'refreshToken')

    process.runTimes = [RunTimeType.SAS]

    sessionRoot = path.join(
      os.tmpdir(),
      `sasjs-session-port-spec-${generateTimestamp()}`
    )
    process.sasjsRoot = sessionRoot
  })

  afterAll(async () => {
    await deleteFolder(sessionRoot)

    await con.connection.dropDatabase()
    await con.connection.close()
    await mongoServer.stop()
  })

  it('lets an owner recorded by uid read their own session', async () => {
    const session = await register({ owner: plainUid }, { log: 'mine' })

    // the package compares the uid first: our records carry usernames, but a
    // record that carries the identifier must not be refused to its own owner
    const res = await request(app)
      .get(`/SASjsApi/session/${session.id}/log`)
      .set('Authorization', `Bearer ${plainToken}`)
      .expect(200)

    expect(res.text).toEqual('mine')

    // and the name-based record still works, which is the fallback
    const byName = await register(
      { owner: plainUser.username },
      { log: 'also mine' }
    )

    await request(app)
      .get(`/SASjsApi/session/${byName.id}/log`)
      .set('Authorization', `Bearer ${plainToken}`)
      .expect(200)
  })

  it('answers a session owned by neither identifier with the package 404', async () => {
    const session = await register(
      { owner: 'someoneElse' },
      { log: 'not yours' }
    )

    const res = await request(app)
      .get(`/SASjsApi/session/${session.id}/log`)
      .set('Authorization', `Bearer ${plainToken}`)
      .expect(404)

    expect(res.body).toEqual({
      message: `Session with ID '${session.id}' was not found.`
    })
  })

  it('answers an _webout that is bytes as bytes', async () => {
    // a program can write any bytes: an xlsx, a zip, a png. Text-decoding them
    // would corrupt the artefact, which is why the port carries
    // `string | Uint8Array` rather than a string
    const bytes = Uint8Array.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0xff, 0xfe])

    const session = await register(
      {},
      {
        webout: bytes,
        headers: 'content-type: application/octet-stream'
      }
    )

    const res = await request(app)
      .get(`/SASjsApi/session/${session.id}/output`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)

    expect(res.headers['content-type']).toContain('application/octet-stream')
    expect(Buffer.from(res.body).equals(Buffer.from(bytes))).toBe(true)
  })

  it('serves desktop mode, whose only user is a sentinel id rather than an ObjectId', async () => {
    // Desktop mode runs as one fixed user whose id is `12345`. The directory the
    // service reads looks accounts up by id, and `12345` is not an ObjectId, so
    // a guard written for token-supplied ids refused the only caller there is -
    // every session route answered 401 in the mode this server also ships in.
    const previousMode = process.env.MODE
    process.env.MODE = ModeType.Desktop

    try {
      const session = await register(
        { owner: desktopUser.username },
        { log: 'desktop log' }
      )

      const res = await request(app)
        .get(`/SASjsApi/session/${session.id}/log`)
        // no token: desktop mode has no login, and the fixed user is the caller
        .expect(200)

      expect(res.text).toEqual('desktop log')

      await request(app).get(`/SASjsApi/session/${session.id}`).expect(200)
    } finally {
      process.env.MODE = previousMode
    }
  })

  it('answers 404 for a session id that never existed', async () => {
    const res = await request(app)
      .get('/SASjsApi/session/not-a-session')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404)

    expect(res.body).toEqual({
      message: "Session with ID 'not-a-session' was not found."
    })
  })
})
