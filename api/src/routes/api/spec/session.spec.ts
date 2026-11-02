import './sessionEnv'
import path from 'path'
import os from 'os'
import { Express } from 'express'
import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'
import { createFile, deleteFolder, generateTimestamp } from '@sasjs/utils'
import appPromise from '../../../app'
import { UserController } from '../../../controllers/'
import { getSessionController } from '../../../controllers/internal'
import {
  generateAccessToken,
  saveTokensInDB,
  RunTimeType,
  getSessionsFolder,
  generateUniqueFileName,
  getFilesFolder
} from '../../../utils/'
import { SASSessionController } from '../../../controllers/internal/Session'
import * as ProcessProgramModule from '../../../controllers/internal/processProgram'
import { Session, SessionState } from '../../../types/Session'

const clientId = 'someclientID'

/**
 * The artifacts of a triggered program: the state a poller reads, the log it
 * prints, and the `_webout` it produced. Before these endpoints existed the log
 * and the output were reachable only through the response body of the
 * synchronous execute endpoints, so a triggered run left them in a folder
 * nothing could read.
 */
/**
 * Waits for a value the server sets asynchronously, up to a deadline.
 *
 * Used where the write is made by a promise nobody awaits - a fixed sleep would
 * be a guess about how long it takes on a loaded runner.
 */
const waitFor = async <T>(
  read: () => T | undefined,
  timeoutMs = 5000
): Promise<T | undefined> => {
  const deadline = Date.now() + timeoutMs
  let value = read()

  while (value === undefined && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 20))
    value = read()
  }

  return value
}

describe('Session artifacts', () => {
  let app: Express
  let con: Mongoose
  let mongoServer: MongoMemoryServer
  const controller = new UserController()

  const admin = {
    displayName: 'Test Admin',
    username: 'adminUsername',
    password: 'adminPassword',
    isAdmin: true,
    isActive: true
  }

  const plainUser = {
    displayName: 'Plain User',
    username: 'plainUsername',
    password: 'userPassword',
    isAdmin: false,
    isActive: true
  }

  let token: string
  let plainToken: string
  let sessionRoot: string
  // a counter as well as a timestamp: generateTimestamp() is millisecond
  // resolution, so two sessions registered in the same millisecond share an id
  // and the lookup finds the first one
  let sessionCount = 0

  const registerSession = async (
    overrides: Partial<Session> = {},
    artifacts: { log?: string; webout?: string; headers?: string } = {}
  ): Promise<Session> => {
    sessionCount += 1
    const sessionId = `20241028074744-54132-${generateTimestamp()}-${sessionCount}`
    const sessionPath = path.join(sessionRoot, sessionId)

    const session: Session = {
      id: sessionId,
      state: SessionState.completed,
      creationTimeStamp: sessionId.split('-').pop() as string,
      deathTimeStamp: (new Date().getTime() + 60_000).toString(),
      path: sessionPath,
      // every session has an owner; the admin owns the fixtures unless a case
      // says otherwise
      owner: admin.username,
      ...overrides
    }

    await createFile(path.join(sessionPath, 'log.log'), artifacts.log ?? '')

    if (artifacts.webout !== undefined)
      await createFile(path.join(sessionPath, 'webout.txt'), artifacts.webout)

    await createFile(
      path.join(sessionPath, 'stpsrv_header.txt'),
      artifacts.headers ?? 'content-type: text/html; charset=utf-8'
    )

    // registered on whichever controller owns the first runtime, which is the
    // one the endpoints search first
    const sessionController = getSessionController(RunTimeType.SAS)
    ;(sessionController as any).sessions.push(session)

    return session
  }

  beforeAll(async () => {
    app = await appPromise

    mongoServer = await MongoMemoryServer.create()
    con = await mongoose.connect(mongoServer.getUri())

    await controller.createUser(admin)

    await controller.createUser(plainUser)

    const user = await controller.getUserByUsername(
      { user: { isAdmin: false } } as any,
      admin.username
    )
    token = generateAccessToken({ clientId, userId: user.uid })
    await saveTokensInDB(user.uid, clientId, token, 'refreshToken')

    const plain = await controller.getUserByUsername(
      { user: { isAdmin: false } } as any,
      plainUser.username
    )
    plainToken = generateAccessToken({ clientId, userId: plain.uid })
    await saveTokensInDB(plain.uid, clientId, plainToken, 'refreshToken')

    // the endpoints search every runtime the process declares, and in test
    // mode setProcessVariables returns before it reads RUN_TIMES, so the suite
    // states the one it registers against
    process.runTimes = [RunTimeType.SAS]

    sessionRoot = path.join(
      os.tmpdir(),
      `sasjs-session-artifacts-spec-${generateTimestamp()}`
    )
    process.sasjsRoot = sessionRoot
    process.driveLoc = path.join(sessionRoot, 'drive')
  })

  afterAll(async () => {
    await deleteFolder(sessionRoot)

    await con.connection.dropDatabase()
    await con.connection.close()
    await mongoServer.stop()
  })

  describe('GET /SASjsApi/session/{sessionId}/state', () => {
    it('answers an object, the shape a Viya caller already polls', async () => {
      const session = await registerSession({ state: SessionState.running })

      const res = await request(app)
        .get(`/SASjsApi/session/${session.id}/state`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(res.body).toEqual({ state: SessionState.running })
    })

    it('answers 404 for a session that does not exist', async () => {
      const res = await request(app)
        .get('/SASjsApi/session/not-a-session/state')
        .set('Authorization', `Bearer ${token}`)
        .expect(404)

      expect(res.body.message).toContain('not-a-session')
    })
  })

  describe('a triggered program records its owner', () => {
    // The specs above hand the owner to the fixture, so none of them exercises
    // `session.owner = preProgramVariables.username`. If that line stopped
    // firing - a trigger that arrived without a username, say - every session
    // would stay unowned, every read would be unrestricted, and the rest of the
    // suite would still be green.
    beforeAll(async () => {
      await createFile(
        path.join(getFilesFolder(), 'owned-trigger.sas'),
        'data _null; run;'
      )

      // registered on the controller as a real session would be, so the
      // lookup the endpoints use finds the same object the execute path wrote
      // the owner to
      jest
        .spyOn(SASSessionController.prototype, 'getSession')
        .mockImplementation(async function (
          this: SASSessionController,
          username: string
        ) {
          const sessionId = generateUniqueFileName(generateTimestamp())
          const session = {
            id: sessionId,
            state: SessionState.pending,
            creationTimeStamp: sessionId.split('-').pop() as string,
            deathTimeStamp: (new Date().getTime() + 60_000).toString(),
            path: path.join(getSessionsFolder(), sessionId),
            owner: username
          }

          ;(this as any).sessions.push(session)

          return session
        })

      jest
        .spyOn(ProcessProgramModule, 'processProgram')
        .mockImplementation(() => Promise.resolve())
    })

    afterAll(() => jest.restoreAllMocks())

    it('records the caller, and refuses a different user', async () => {
      const triggered = await request(app)
        .post('/SASjsApi/stp/trigger?_program=/owned-trigger.sas')
        .set('Authorization', `Bearer ${token}`)
        .send()
        .expect(200)

      const sessionId = triggered.body.sessionId

      // The trigger returns as soon as the session exists, and the program runs
      // unawaited, so the owner is written a tick or two later. Poll for it
      // rather than sleeping a fixed time: a loaded runner can take longer than
      // any constant chosen here.
      const owner = await waitFor(
        () =>
          getSessionController(RunTimeType.SAS).getSessionById(sessionId)?.owner
      )

      expect(owner).toEqual(admin.username)

      // and the rule holds from there: a non-admin caller gets 404
      await request(app)
        .get(`/SASjsApi/session/${sessionId}/log`)
        .set('Authorization', `Bearer ${plainToken}`)
        .expect(404)
    })
  })

  describe('ownership', () => {
    // a session id is not a secret: it goes to the caller that triggered the
    // program, and it is a timestamp plus a small random number, so it is
    // guessable within a window
    it('lets the owner read the log and the output', async () => {
      const session = await registerSession(
        { owner: plainUser.username },
        { log: 'mine', webout: 'my output' }
      )

      await request(app)
        .get(`/SASjsApi/session/${session.id}/log`)
        .set('Authorization', `Bearer ${plainToken}`)
        .expect(200)

      await request(app)
        .get(`/SASjsApi/session/${session.id}/output`)
        .set('Authorization', `Bearer ${plainToken}`)
        .expect(200)
    })

    it('tells another user the session does not exist', async () => {
      const session = await registerSession(
        { owner: 'someoneElse' },
        { log: 'not yours', webout: 'not yours' }
      )

      // 404 rather than 403: confirming the id would confirm the guess
      await request(app)
        .get(`/SASjsApi/session/${session.id}/log`)
        .set('Authorization', `Bearer ${plainToken}`)
        .expect(404)

      await request(app)
        .get(`/SASjsApi/session/${session.id}/output`)
        .set('Authorization', `Bearer ${plainToken}`)
        .expect(404)

      await request(app)
        .get(`/SASjsApi/session/${session.id}`)
        .set('Authorization', `Bearer ${plainToken}`)
        .expect(404)
    })

    it('lets an administrator read any session', async () => {
      const session = await registerSession(
        { owner: 'someoneElse' },
        { log: 'support case' }
      )

      await request(app)
        .get(`/SASjsApi/session/${session.id}/log`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
    })

    it('refuses a session whose owner is someone else, even when unset', async () => {
      // there is no fallback: an owner that does not match is a 404, so a
      // missing owner cannot open a session up
      const session = await registerSession({ owner: '' }, { log: 'orphan' })

      await request(app)
        .get(`/SASjsApi/session/${session.id}/log`)
        .set('Authorization', `Bearer ${plainToken}`)
        .expect(404)
    })
  })

  describe('GET /SASjsApi/session/{sessionId}', () => {
    it('describes the session without exposing the server folder', async () => {
      const session = await registerSession({
        state: SessionState.failed,
        failureReason: '%abort cancel',
        pid: 12345
      })

      const res = await request(app)
        .get(`/SASjsApi/session/${session.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(res.body).toEqual({
        sessionId: session.id,
        state: SessionState.failed,
        pid: 12345,
        creationTimeStamp: session.creationTimeStamp,
        deathTimeStamp: session.deathTimeStamp,
        failureReason: '%abort cancel'
      })

      expect(res.body.path).toBeUndefined()
      expect(JSON.stringify(res.body)).not.toContain(sessionRoot)
    })

    it('reports the retention window the caller asked for', async () => {
      const session = await registerSession({
        expiresAfterMins: { mins: 60, used: false }
      })

      const res = await request(app)
        .get(`/SASjsApi/session/${session.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(res.body.expiresAfterMins).toEqual({ mins: 60, used: false })
    })

    it('answers 404 for a session that does not exist', async () => {
      await request(app)
        .get('/SASjsApi/session/not-a-session')
        .set('Authorization', `Bearer ${token}`)
        .expect(404)
    })
  })

  describe('GET /SASjsApi/session/{sessionId}/log', () => {
    it('returns the log the program printed as plain text', async () => {
      const session = await registerSession(
        {},
        { log: 'NOTE: hello from the job\nERROR: and something wrong\n' }
      )

      const res = await request(app)
        .get(`/SASjsApi/session/${session.id}/log`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(res.headers['content-type']).toContain('text/plain')
      expect(res.text).toContain('ERROR: and something wrong')
    })

    it('answers an empty body while the run has written nothing', async () => {
      const session = await registerSession({}, { log: '' })

      const res = await request(app)
        .get(`/SASjsApi/session/${session.id}/log`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(res.text).toEqual('')
    })

    it('answers 404 once the session is gone, rather than an empty log', async () => {
      // the distinction a poller needs: nothing written yet is 200 and empty,
      // a destroyed session is 404 and final
      await request(app)
        .get('/SASjsApi/session/expired-session/log')
        .set('Authorization', `Bearer ${token}`)
        .expect(404)
    })
  })

  describe('GET /SASjsApi/session/{sessionId}/output', () => {
    it('returns the webout with the content type the program set', async () => {
      const session = await registerSession(
        {},
        {
          webout: '{"rows":[{"id":1}]}',
          headers: 'content-type: application/json; charset=utf-8'
        }
      )

      const res = await request(app)
        .get(`/SASjsApi/session/${session.id}/output`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(res.headers['content-type']).toContain('application/json')
      expect(res.text).toEqual('{"rows":[{"id":1}]}')
    })

    it('drops a malformed header line instead of passing it on', async () => {
      const session = await registerSession(
        {},
        {
          webout: 'x',
          // the synchronous path validates every header line before it applies
          // it, and the asynchronous one goes through the same extraction
          headers: 'content-type: text/plain\nthis line has no colon'
        }
      )

      const res = await request(app)
        .get(`/SASjsApi/session/${session.id}/output`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(res.headers['content-type']).toContain('text/plain')
      expect(res.headers['this line has no colon']).toBeUndefined()
    })

    it('answers an empty body when the program wrote no output', async () => {
      const session = await registerSession({}, {})

      const res = await request(app)
        .get(`/SASjsApi/session/${session.id}/output`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(res.text ?? '').toEqual('')
    })

    it('answers 404 for a session that does not exist', async () => {
      await request(app)
        .get('/SASjsApi/session/not-a-session/output')
        .set('Authorization', `Bearer ${token}`)
        .expect(404)
    })
  })
})
