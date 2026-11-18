import express from 'express'
import cookieParser from 'cookie-parser'
import fs from 'fs'
import os from 'os'
import path from 'path'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'
import { PermissionController, UserController } from '../../controllers'
import * as internal from '../../controllers/internal'
import Group from '../../model/Group'
import Permission from '../../model/Permission'
import {
  generateAccessToken,
  ModeType,
  RunTimeType,
  saveTokensInDB
} from '../../utils'

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sas9-get-auth-'))
const oldLocation = process.env.STATIC_MOCK_LOCATION
process.env.STATIC_MOCK_LOCATION = root
import sas9WebRouter from '../web/sas9-web'

const app = express()
app.use(cookieParser())
app.use(express.json())
app.use(sas9WebRouter)

describe('SAS 9 mock GET execution in server mode', () => {
  const oldMode = process.env.MODE
  const oldSecrets = process.secrets
  const oldDrive = process.driveLoc
  const oldRunTimes = process.runTimes
  const oldLogger = process.logger
  let mongo: MongoMemoryServer
  let execute: jest.SpyInstance
  let token: string
  let userId: string
  const url =
    '/SASStoredProcess/do?_USERNAME=alice&_PASSWORD=anything&_PROGRAM=/Case/Program&CuStOm=VaL%2Bue'

  beforeAll(async () => {
    process.env.MODE = ModeType.Server
    process.secrets = { ACCESS_TOKEN_SECRET: 'sas9-get-test-secret' } as any
    process.driveLoc = path.join(root, 'drive')
    process.runTimes = [RunTimeType.JS]
    process.logger = {
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn()
    } as any
    fs.mkdirSync(path.join(root, 'drive', 'files', 'Case'), { recursive: true })
    fs.mkdirSync(path.join(root, 'sas9', 'generic'), { recursive: true })
    fs.writeFileSync(
      path.join(root, 'drive', 'files', 'Case', 'Program.js'),
      '// test'
    )
    fs.writeFileSync(
      path.join(root, 'sas9', 'generic', 'logged-in'),
      'signed in'
    )
    fs.writeFileSync(
      path.join(root, 'sas9', 'generic', 'logged-out'),
      'signed out'
    )
    fs.writeFileSync(
      path.join(root, 'sas9', 'generic', 'sas-stored-process'),
      'root fixture'
    )
    execute = jest
      .spyOn(internal.ExecutionController.prototype, 'executeFile')
      .mockResolvedValue({ result: 'executed' } as any)
    mongo = await MongoMemoryServer.create()
    await mongoose.connect(mongo.getUri())
    const user = await new UserController().createUser({
      displayName: 'Get User',
      username: 'getUser',
      password: 'password123',
      isAdmin: false,
      isActive: true
    })
    userId = user.uid
    token = generateAccessToken({ clientId: 'get-client', userId })
    await saveTokensInDB(userId, 'get-client', token, 'refreshToken')
  })

  beforeEach(async () => {
    execute.mockClear()
    await request(app).get('/SASLogon/logout').expect(200)
  })

  afterAll(async () => {
    if (mongoose.connection.readyState) {
      await mongoose.connection.dropDatabase()
      await mongoose.connection.close()
    }
    if (mongo) await mongo.stop()
    jest.restoreAllMocks()
    fs.rmSync(root, { recursive: true, force: true })
    if (oldLocation === undefined) delete process.env.STATIC_MOCK_LOCATION
    else process.env.STATIC_MOCK_LOCATION = oldLocation
    if (oldMode === undefined) delete process.env.MODE
    else process.env.MODE = oldMode
    process.secrets = oldSecrets
    process.driveLoc = oldDrive
    process.runTimes = oldRunTimes
    process.logger = oldLogger
  })

  it('rejects query mock credentials without a real authenticated caller', async () => {
    await request(app).get(url).expect(401)
    expect(execute).not.toHaveBeenCalled()
  })

  it('rejects a mock login without a real authenticated caller', async () => {
    await request(app)
      .post('/SASLogon/login')
      .type('form')
      .send({ username: 'alice' })
      .expect(200)
    await request(app)
      .get('/SASStoredProcess/do?_PROGRAM=/Case/Program')
      .expect(401)
    expect(execute).not.toHaveBeenCalled()
  })

  it('denies a real user without an execute grant', async () => {
    await request(app).get(url).auth(token, { type: 'bearer' }).expect(401)
    expect(execute).not.toHaveBeenCalled()
  })

  it('also protects HEAD requests routed through the GET handler', async () => {
    await request(app).head(url).expect(401)
    expect(execute).not.toHaveBeenCalled()
  })

  it('runs for a real user granted the canonical execute permission', async () => {
    await new PermissionController().createPermission({
      type: 'Route' as any,
      principalType: 'user' as any,
      setting: 'Grant' as any,
      path: '/SASjsApi/stp/execute',
      principalId: userId
    })
    const res = await request(app)
      .get(url)
      .auth(token, { type: 'bearer' })
      .expect(200)
    expect(res.text).toBe('executed')
    expect(execute).toHaveBeenCalledTimes(1)
    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({
        programPath: path.join(root, 'drive', 'files', 'Case', 'Program.js'),
        vars: expect.objectContaining({
          _program: '/Case/Program',
          custom: 'VaL+ue'
        }),
        preProgramVariables: expect.objectContaining({
          userId,
          username: 'getUser'
        })
      })
    )
  })

  it('rejects anonymous callers even when execute is public', async () => {
    const group = await Group.create({ name: 'public' })
    await Permission.create({
      path: '/SASjsApi/stp/execute',
      type: 'Route',
      setting: 'Grant',
      group: group._id
    })
    try {
      await request(app).get(url).expect(401)
      expect(execute).not.toHaveBeenCalled()
    } finally {
      await Permission.deleteMany({ group: group._id })
      await Group.deleteOne({ _id: group._id })
    }
  })

  it('leaves the root fixture-only route separate from execute permission', async () => {
    await request(app)
      .post('/SASLogon/login')
      .type('form')
      .send({ username: 'alice' })
      .expect(200)
    const res = await request(app).get('/SASStoredProcess').expect(200)
    expect(res.text).toBe('root fixture')
    expect(execute).not.toHaveBeenCalled()
  })
})
