import path from 'path'
import { createFile, deleteFolder } from '@sasjs/utils'
import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'
import * as fileUtil from '../../utils/file'
import * as sessions from '../../controllers/internal/Session'

const root = path.join(process.cwd(), `tmp-tier-post-auth-${process.pid}`)
const drive = path.join(root, 'files')
jest.spyOn(fileUtil, 'getFilesFolder').mockImplementation(() => drive)
jest
  .spyOn(fileUtil, 'getAppStreamConfigPath')
  .mockImplementation(() => path.join(root, 'appStreamConfig.json'))

import express, { Express } from 'express'
import cookieParser from 'cookie-parser'

// The app sets up JWT secrets at import time, so select server mode first.
const originalMode = process.env.MODE
const originalSasPath = process.env.SAS_PATH
const originalRunTimes = process.env.RUN_TIMES
process.env.MODE = 'server'
process.env.SAS_PATH = process.env.SAS_PATH || '/bin/true'
process.env.RUN_TIMES = process.env.RUN_TIMES || 'sas'
const appPromise: Promise<Express> = require('../../app').default
import { UserController } from '../../controllers'
import { generateAccessToken, saveTokensInDB, RunTimeType } from '../../utils'
import sas9WebRouter from '../web/sas9-web'
import * as internal from '../../controllers/internal'
import fs from 'fs'

const mockApp = express()
mockApp.use(cookieParser())
mockApp.use(express.json())
mockApp.use(sas9WebRouter)

describe('authenticated tier POST', () => {
  let app: Awaited<typeof appPromise>
  let mongo: MongoMemoryServer
  let db: Mongoose
  let token: string
  const program = '/PostAuth/capture'
  const oldRunTimes = process.runTimes
  const oldNodeLoc = process.nodeLoc

  beforeAll(async () => {
    app = await appPromise
    process.runTimes = [RunTimeType.JS]
    process.nodeLoc = process.execPath
    mongo = await MongoMemoryServer.create()
    db = await mongoose.connect(mongo.getUri())
    const users = new UserController()
    await users.createUser({
      displayName: 'Tier Admin',
      username: 'postAdmin',
      password: 'adminPassword',
      isAdmin: true,
      isActive: true
    })
    const user = await users.getUserByUsername(
      { user: { isAdmin: false } } as any,
      'postAdmin'
    )
    token = generateAccessToken({ clientId: 'post-client', userId: user.uid })
    await saveTokensInDB(user.uid, 'post-client', token, 'refreshToken')
    await createFile(
      path.join(drive, 'PostAuth', 'capture.js'),
      `_webout = JSON.stringify({region, _program, params: _sasjs_fetch_context.params})`
    )
  })

  afterAll(async () => {
    await deleteFolder(root)
    await db.connection.dropDatabase()
    await db.connection.close()
    await mongo.stop()
    process.runTimes = oldRunTimes
    process.nodeLoc = oldNodeLoc
    for (const [name, value] of [
      ['MODE', originalMode],
      ['SAS_PATH', originalSasPath],
      ['RUN_TIMES', originalRunTimes]
    ]) {
      if (value === undefined) delete process.env[name!]
      else process.env[name!] = value
    }
    jest.restoreAllMocks()
  })

  it('rejects unauthenticated multipart requests before creating an upload session', async () => {
    const getSession = jest.spyOn(sessions, 'getSessionController')
    await request(app)
      .post(`/StoredProgram?_PROGRAM=${program}&Region=query`)
      .field('Region', 'body')
      .attach('table', Buffer.from('x'), 'test.csv')
      .expect(401)
    expect(getSession).not.toHaveBeenCalled()
    getSession.mockRestore()
  })

  it('denies a server caller without the execute grant before upload allocation', async () => {
    const users = new UserController()
    await users.createUser({
      displayName: 'Plain',
      username: 'postPlain',
      password: 'plainPassword',
      isAdmin: false,
      isActive: true
    })
    const user = await users.getUserByUsername(
      { user: { isAdmin: false } } as any,
      'postPlain'
    )
    const plainToken = generateAccessToken({
      clientId: 'plain-client',
      userId: user.uid
    })
    await saveTokensInDB(user.uid, 'plain-client', plainToken, 'refreshToken')
    await request(mockApp)
      .post('/SASLogon/login')
      .type('form')
      .send({ username: 'alice' })
      .expect(200)
    const getSession = jest.spyOn(sessions, 'getSessionController')
    try {
      await request(mockApp)
        .post(`/SASStoredProcess/do?_PROGRAM=${program}`)
        .auth(plainToken, { type: 'bearer' })
        .attach('table', Buffer.from('denied'), 'test.csv')
        .expect(401)
      expect(getSession).not.toHaveBeenCalled()
    } finally {
      getSession.mockRestore()
    }
  })

  it('accepts a real server caller with mock login and executes their upload', async () => {
    await request(mockApp)
      .post('/SASLogon/login')
      .type('form')
      .send({ username: 'alice' })
      .expect(200)
    const execute = jest
      .spyOn(internal.ExecutionController.prototype, 'executeFile')
      .mockResolvedValue({ result: 'executed' } as any)
    const folder = path.join(root, 'upload')
    fs.mkdirSync(folder, { recursive: true })
    const getSession = jest
      .spyOn(sessions, 'getSessionController')
      .mockReturnValue({
        getSession: async () => ({ path: folder })
      } as any)
    try {
      const result = await request(mockApp)
        .post(`/SASStoredProcess/do?_PROGRAM=${program}`)
        .auth(token, { type: 'bearer' })
        .attach('table', Buffer.from('authorized'), 'test.csv')
        .expect(200)
      expect(result.text).toBe('executed')
      expect(getSession).toHaveBeenCalled()
      expect(execute).toHaveBeenCalled()
      expect(fs.readdirSync(folder)).toHaveLength(1)
    } finally {
      getSession.mockRestore()
      execute.mockRestore()
    }
  })

  it('merges authenticated multipart fields and runs the query-selected program', async () => {
    const res = await request(app)
      .post(`/StoredProgram?_PROGRAM=${program}&Region=query`)
      .auth(token, { type: 'bearer' })
      .field('Region', 'body')
      .field('_PROGRAM', '/wrong')
      .attach('table', Buffer.from('x'), 'test.csv')
      .expect(200)
    const result = JSON.parse(res.text)
    expect(result.region).toBe('body')
    expect(result._program).toBe(program)
    expect(result.params.Region).toBeUndefined()
    expect(result.params._PROGRAM).toBeUndefined()
  })
})
