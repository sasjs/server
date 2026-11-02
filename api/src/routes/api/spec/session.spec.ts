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
  RunTimeType
} from '../../../utils/'
import { Session, SessionState } from '../../../types/Session'

const clientId = 'someclientID'

/**
 * The artifacts of a triggered program: the state a poller reads, the log it
 * prints, and the `_webout` it produced. Before these endpoints existed the log
 * and the output were reachable only through the response body of the
 * synchronous execute endpoints, so a triggered run left them in a folder
 * nothing could read.
 */
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

  let token: string
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

    const user = await controller.getUserByUsername(
      { user: { isAdmin: false } } as any,
      admin.username
    )
    token = generateAccessToken({ clientId, userId: user.uid })
    await saveTokensInDB(user.uid, clientId, token, 'refreshToken')

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
