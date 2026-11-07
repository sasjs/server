import { Express } from 'express'
import path from 'path'
import os from 'os'
import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'
import { createFile, deleteFolder, generateTimestamp } from '@sasjs/utils'
import { DEFAULT_IDENTITY, SESSION_CORPUS } from '@sasjs/api'
import type { CorpusCase } from '@sasjs/api'

import appPromise from '../../../app'
import { UserController } from '../../../controllers'
import { getSessionController } from '../../../controllers/internal'
import {
  generateAccessToken,
  RunTimeType,
  saveTokensInDB
} from '../../../utils'
import { Session, SessionState } from '../../../types/Session'

/**
 * The session corpus, run against this server's real HTTP surface.
 *
 * `recordsCorpus.spec.ts` is the administration half of "the same API"; this is
 * the session half, and it had never been run here. The cases come from
 * `@sasjs/api`, so a change to these routes that the package does not carry now
 * fails a case rather than surfacing on a host months later - and a case the
 * package states from its own mock rather than from the document fails here,
 * which is how the `state` shape was found.
 *
 * Two translations, neither of them an assertion softened:
 *
 * - a fixture names its accounts by uid (`user-admin`), a session record names
 *   its owner by username, and that is deliberate: the package tries the uid
 *   first and the username second, because a host that keeps usernames must not
 *   404 the owner of every session. The seed writes usernames, so the fallback
 *   is the path under test.
 * - a fixture states a `subject`, and HTTP states a token, so a token is minted
 *   per fixture account and the case's subject picks it.
 */
describe('session conformance corpus', () => {
  let app: Express
  let con: Mongoose
  let mongoServer: MongoMemoryServer
  let sessionRoot: string

  /** fixture uid -> the token this server minted for that account. */
  const tokens = new Map<string, string>()
  /** fixture username -> the session owner a record carries. */
  const usernames = new Map<string, string>()

  const ADMIN = { userId: 'user-admin', clientId: 'web_app' }
  const RESTRICTED = { userId: 'user-restricted', clientId: 'web_app' }

  beforeAll(async () => {
    app = await appPromise

    mongoServer = await MongoMemoryServer.create()
    con = await mongoose.connect(mongoServer.getUri())

    const users = new UserController()

    for (const user of DEFAULT_IDENTITY.users) {
      await users.createUser({
        username: user.username,
        displayName: user.displayName,
        password: user.password,
        isAdmin: user.isAdmin,
        isActive: user.isActive
      })

      const created = await users.getUserByUsername(
        { user: { isAdmin: false } } as any,
        user.username
      )
      const token = generateAccessToken({
        clientId: ADMIN.clientId,
        userId: created.uid
      })
      await saveTokensInDB(created.uid, ADMIN.clientId, token, 'refreshToken')

      tokens.set(user.uid, token)
      usernames.set(user.uid, user.username)
    }

    // the routes search every runtime the process declares; test mode returns
    // before RUN_TIMES is read, so the suite states the one it registers on
    process.runTimes = [RunTimeType.SAS]

    sessionRoot = path.join(
      os.tmpdir(),
      `sasjs-session-corpus-${generateTimestamp()}`
    )
    process.sasjsRoot = sessionRoot

    // the three sessions `@sasjs/api`'s own fixture describes: one completed and
    // owned by an administrator, one running and owned by the restricted user,
    // and one that exists but has written nothing
    await register(
      'sess-admin',
      {
        owner: usernames.get(ADMIN.userId) as string,
        state: SessionState.completed,
        pid: 4242,
        creationTimeStamp: '2026-11-07T09:00:00.000Z',
        deathTimeStamp: '2026-11-07T09:00:04.000Z',
        expiresAfterMins: { mins: 60, used: false }
      },
      {
        log: 'NOTE: session started\nNOTE: session completed\n',
        webout: '<html><body>42</body></html>'
      }
    )

    await register(
      'sess-restricted',
      {
        owner: usernames.get(RESTRICTED.userId) as string,
        state: SessionState.running,
        pid: 4243,
        creationTimeStamp: '2026-11-07T09:05:00.000Z'
      },
      {
        log: 'NOTE: session started\n',
        webout: ''
      }
    )

    await register(
      'sess-silent',
      {
        owner: usernames.get(ADMIN.userId) as string,
        state: SessionState.running,
        pid: 4244,
        creationTimeStamp: '2026-11-07T09:10:00.000Z'
      },
      { log: '', webout: '' }
    )
  })

  const register = async (
    id: string,
    overrides: Partial<Session>,
    artifacts: { log: string; webout: string }
  ) => {
    const sessionPath = path.join(sessionRoot, id)

    const session: Session = {
      id,
      state: SessionState.completed,
      creationTimeStamp: id,
      // a session that has not finished has no death stamp, and the document
      // omits the property rather than sending null
      deathTimeStamp: '',
      path: sessionPath,
      owner: '',
      ...overrides
    }

    if (!('deathTimeStamp' in overrides))
      delete (session as Partial<Session>).deathTimeStamp

    await createFile(path.join(sessionPath, 'log.log'), artifacts.log)
    await createFile(path.join(sessionPath, 'webout.txt'), artifacts.webout)
    await createFile(
      path.join(sessionPath, 'stpsrv_header.txt'),
      'content-type: text/html; charset=utf-8'
    )

    const controller = getSessionController(RunTimeType.SAS)
    ;(controller as any).sessions.push(session)
  }

  afterAll(async () => {
    await deleteFolder(sessionRoot)

    await con.connection.dropDatabase()
    await con.connection.close()
    await mongoServer.stop()
  })

  /** The path a case names, with its path parameter filled in. */
  const pathOf = (testCase: CorpusCase): string =>
    testCase.route
      .replace(/^[A-Z]+ /, '')
      .replace('{sessionId}', String(testCase.request.params?.sessionId))

  const asUser = (url: string, subject?: { userId: string }) =>
    subject
      ? request(app)
          .get(url)
          .set('Authorization', `Bearer ${tokens.get(subject.userId)}`)
      : request(app).get(url)

  const cases = SESSION_CORPUS

  it.each(cases)('$id: $description', async (testCase) => {
    const response = await asUser(pathOf(testCase), testCase.request.subject)

    expect({ case: testCase.id, status: response.status }).toEqual({
      case: testCase.id,
      status: testCase.expect.status
    })

    if (testCase.expect.error !== undefined) {
      // a 401 from the middleware is sent as text, every other refusal as the
      // `{ message }` body these routes have always answered
      const message =
        response.status === 401 ? response.text : response.body.message

      expect({ case: testCase.id, error: message }).toEqual({
        case: testCase.id,
        error: testCase.expect.error
      })
    }

    if (testCase.expect.body !== undefined)
      expect(response.body).toEqual(testCase.expect.body)

    if (testCase.expect.contents !== undefined)
      expect(response.text).toEqual(testCase.expect.contents)
  })
})
