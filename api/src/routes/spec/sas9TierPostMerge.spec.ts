import express from 'express'
import cookieParser from 'cookie-parser'
import fs from 'fs'
import path from 'path'
import request from 'supertest'
import * as internal from '../../controllers/internal'
import * as session from '../../controllers/internal/Session'
import { RunTimeType } from '../../utils'
import * as routeAccess from '../../utils/isPublicRoute'
import { ModeType } from '../../utils'

const root = path.join(process.cwd(), 'tmp', `sas9-post-${process.pid}`)
const oldLocation = process.env.STATIC_MOCK_LOCATION
process.env.STATIC_MOCK_LOCATION = root
import sas9WebRouter from '../web/sas9-web'

const app = express()
app.use(cookieParser())
app.use(express.json())
app.use((req, _res, next) => {
  req.user = { username: 'desktop' } as any
  next()
})
app.use('/', sas9WebRouter)

describe('SAS 9 mock tier POST merging', () => {
  let execute: jest.SpyInstance
  const oldDrive = process.driveLoc
  const oldRunTimes = process.runTimes
  const oldLogger = process.logger
  const oldMode = process.env.MODE
  beforeAll(() => {
    process.env.MODE = ModeType.Desktop
    fs.mkdirSync(path.join(root, 'sas9', 'generic'), { recursive: true })
    fs.mkdirSync(path.join(root, 'drive', 'files', 'Case'), { recursive: true })
    fs.writeFileSync(
      path.join(root, 'sas9', 'generic', 'logged-in'),
      'signed in'
    )
    fs.writeFileSync(
      path.join(root, 'sas9', 'generic', 'logged-out'),
      'signed out'
    )
    fs.writeFileSync(
      path.join(root, 'drive', 'files', 'Case', 'Program.js'),
      '// test'
    )
    process.driveLoc = path.join(root, 'drive')
    process.runTimes = [RunTimeType.JS]
    process.logger = {
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn()
    } as any
    execute = jest
      .spyOn(internal.ExecutionController.prototype, 'executeFile')
      .mockResolvedValue({ result: 'executed' } as any)
    jest
      .spyOn(session, 'getSessionController')
      .mockReturnValue({ getSession: async () => ({ path: root }) } as any)
  })
  beforeEach(async () => {
    execute.mockClear()
    await request(app).get('/SASLogon/logout').expect(200)
  })
  afterAll(() => {
    jest.restoreAllMocks()
    fs.rmSync(root, { recursive: true, force: true })
    if (oldLocation === undefined) delete process.env.STATIC_MOCK_LOCATION
    else process.env.STATIC_MOCK_LOCATION = oldLocation
    process.driveLoc = oldDrive
    process.runTimes = oldRunTimes
    process.logger = oldLogger
    if (oldMode === undefined) delete process.env.MODE
    else process.env.MODE = oldMode
  })
  it.each(['json', 'multipart'])(
    'merges %s body fields without replacing the selected program',
    async (format) => {
      await request(app)
        .post('/SASLogon/login')
        .type('form')
        .send({ username: 'alice' })
        .expect(200)
      const req = request(app).post(
        '/SASStoredProcess/do?_PROGRAM=/Case/Program&Region=query'
      )
      if (format === 'json')
        req.send({ Region: 'body', _PrOgRaM: '/wrong', OtherField: 'Kept' })
      else
        req
          .field('Region', 'body')
          .field('_PrOgRaM', '/wrong')
          .field('OtherField', 'Kept')
          .attach('table', Buffer.from('x'), 'test.csv')
      const res = await req.expect(200)
      expect(res.text).toBe('executed')
      const { vars, programPath } = execute.mock.calls[0][0]
      expect(programPath).toBe(
        path.join(root, 'drive', 'files', 'Case', 'Program.js')
      )
      expect(vars).toMatchObject({
        region: 'body',
        _program: '/Case/Program',
        OtherField: 'Kept'
      })
      expect(vars.Region).toBeUndefined()
      expect(vars._PrOgRaM).toBeUndefined()
    }
  )
  it('keeps a body-selected program identity when another body spelling conflicts', async () => {
    await request(app)
      .post('/SASLogon/login')
      .type('form')
      .send({ username: 'alice' })
      .expect(200)
    const res = await request(app)
      .post('/SASStoredProcess/do')
      .send({ _program: '/Case/Program', _PROGRAM: '/wrong' })
      .expect(200)
    expect(res.text).toBe('executed')
    const { vars } = execute.mock.calls[0][0]
    expect(vars._program).toBe('/Case/Program')
    expect(vars._PROGRAM).toBeUndefined()
  })
  it.each([
    ['logged out', undefined, '/SASLogon/login'],
    ['public', 'PUBLIC', '/SASLogon/Login']
  ])(
    'refuses a %s multipart upload before allocating or writing',
    async (_state, username, redirect) => {
      const originalMode = process.env.MODE
      process.env.MODE = 'server'
      const getSession = jest.spyOn(session, 'getSessionController')
      getSession.mockClear()
      const before = fs.readdirSync(root).sort()
      try {
        if (username)
          await request(app)
            .post('/SASLogon/login')
            .type('form')
            .send({ username })
            .expect(200)
        await request(app)
          .post('/SASStoredProcess/do?_PROGRAM=/Case/Program')
          .attach('table', Buffer.from('unauthorized'), 'test.csv')
          .expect(302)
          .expect('Location', redirect)
        expect(getSession).not.toHaveBeenCalled()
        expect(fs.readdirSync(root).sort()).toEqual(before)
        expect(execute).not.toHaveBeenCalled()
      } finally {
        if (originalMode === undefined) delete process.env.MODE
        else process.env.MODE = originalMode
        fs.readdirSync(root)
          .filter((name) => name.startsWith('req_file_'))
          .forEach((name) => fs.rmSync(path.join(root, name)))
      }
    }
  )

  it('does not let a mock login alone authorize a server-mode upload', async () => {
    const originalMode = process.env.MODE
    const oldSecrets = process.secrets
    process.env.MODE = 'server'
    process.secrets = { ACCESS_TOKEN_SECRET: 'test-secret' } as any
    const publicRoute = jest
      .spyOn(routeAccess, 'isPublicRoute')
      .mockResolvedValue(false)
    const getSession = jest.spyOn(session, 'getSessionController')
    getSession.mockClear()
    try {
      await request(app)
        .post('/SASLogon/login')
        .type('form')
        .send({ username: 'alice' })
        .expect(200)
      await request(app)
        .post('/SASStoredProcess/do?_PROGRAM=/Case/Program')
        .attach('table', Buffer.from('unauthorized'), 'test.csv')
        .expect(401)
      expect(getSession).not.toHaveBeenCalled()
      expect(execute).not.toHaveBeenCalled()
    } finally {
      if (originalMode === undefined) delete process.env.MODE
      else process.env.MODE = originalMode
      process.secrets = oldSecrets
      publicRoute.mockRestore()
    }
  })

  it('rejects even a publicly granted execute route when no real user is authenticated', async () => {
    const originalMode = process.env.MODE
    const oldSecrets = process.secrets
    process.env.MODE = 'server'
    process.secrets = { ACCESS_TOKEN_SECRET: 'test-secret' } as any
    const publicRoute = jest
      .spyOn(routeAccess, 'isPublicRoute')
      .mockResolvedValue(true)
    const getSession = jest.spyOn(session, 'getSessionController')
    getSession.mockClear()
    try {
      await request(app)
        .post('/SASLogon/login')
        .type('form')
        .send({ username: 'alice' })
        .expect(200)
      await request(app)
        .post('/SASStoredProcess/do?_PROGRAM=/Case/Program')
        .attach('table', Buffer.from('unauthorized'), 'test.csv')
        .expect(401)
      expect(getSession).not.toHaveBeenCalled()
      expect(execute).not.toHaveBeenCalled()
    } finally {
      if (originalMode === undefined) delete process.env.MODE
      else process.env.MODE = originalMode
      process.secrets = oldSecrets
      publicRoute.mockRestore()
    }
  })

  it('does not run logged-out or public requests', async () => {
    await request(app)
      .post('/SASStoredProcess/do?_PROGRAM=/Case/Program')
      .send({ Region: 'body' })
      .expect(302)
      .expect('Location', '/SASLogon/login')
    await request(app)
      .post('/SASLogon/login')
      .type('form')
      .send({ username: 'PUBLIC' })
      .expect(200)
    await request(app)
      .post('/SASStoredProcess/do?_PROGRAM=/Case/Program')
      .send({ Region: 'body' })
      .expect(302)
      .expect('Location', '/SASLogon/Login')
    expect(execute).not.toHaveBeenCalled()
  })
})
