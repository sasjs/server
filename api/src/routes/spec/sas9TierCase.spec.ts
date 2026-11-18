import express from 'express'
import cookieParser from 'cookie-parser'
import fs from 'fs'
import path from 'path'
import request from 'supertest'
import * as internal from '../../controllers/internal'
import * as session from '../../controllers/internal/Session'
import { ModeType, RunTimeType } from '../../utils'

const mocksFolder = path.join(process.cwd(), 'tmp', `sas9-case-${process.pid}`)
const originalMockLocation = process.env.STATIC_MOCK_LOCATION
process.env.STATIC_MOCK_LOCATION = mocksFolder

// Import after configuring the singleton mock controller's file location.
import sas9WebRouter from '../web/sas9-web'

const app = express()
app.use(cookieParser())
app.use(express.json())
// Desktop-mode requests have a user assigned by the application middleware.
app.use((req, _res, next) => {
  req.user = { username: 'desktop' } as any
  next()
})
app.use('/', sas9WebRouter)

describe('SAS 9 mock tier query names', () => {
  const drive = path.join(mocksFolder, 'drive')
  let execute: jest.SpyInstance
  const oldDrive = process.driveLoc
  const oldRunTimes = process.runTimes
  const oldLogger = process.logger
  const oldMode = process.env.MODE

  beforeAll(() => {
    process.env.MODE = ModeType.Desktop
    fs.mkdirSync(path.join(mocksFolder, 'sas9', 'generic'), { recursive: true })
    fs.mkdirSync(path.join(mocksFolder, 'sas9', 'Case'), { recursive: true })
    fs.mkdirSync(path.join(drive, 'files', 'Case'), { recursive: true })
    fs.writeFileSync(
      path.join(mocksFolder, 'sas9', 'generic', 'logged-in'),
      'signed in'
    )
    fs.writeFileSync(
      path.join(mocksFolder, 'sas9', 'generic', 'logged-out'),
      'signed out'
    )
    fs.writeFileSync(
      path.join(mocksFolder, 'sas9', 'generic', 'sas-stored-process'),
      'default'
    )
    fs.writeFileSync(
      path.join(mocksFolder, 'sas9', 'Case', 'Program'),
      'correct program'
    )
    fs.writeFileSync(path.join(drive, 'files', 'Case', 'Program.js'), '// test')
    process.driveLoc = drive
    process.runTimes = [RunTimeType.JS]
    process.logger = {
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn()
    } as any
    execute = jest
      .spyOn(internal.ExecutionController.prototype, 'executeFile')
      .mockResolvedValue({ result: 'executed' } as any)
    jest.spyOn(session, 'getSessionController').mockReturnValue({
      getSession: async () => ({ path: mocksFolder })
    } as any)
  })

  beforeEach(async () => {
    execute.mockClear()
    await request(app).get('/SASLogon/logout').expect(200)
  })

  afterAll(() => {
    jest.restoreAllMocks()
    fs.rmSync(mocksFolder, { recursive: true, force: true })
    if (originalMockLocation === undefined)
      delete process.env.STATIC_MOCK_LOCATION
    else process.env.STATIC_MOCK_LOCATION = originalMockLocation
    process.driveLoc = oldDrive
    process.runTimes = oldRunTimes
    process.logger = oldLogger
    if (oldMode === undefined) delete process.env.MODE
    else process.env.MODE = oldMode
  })

  it('selects the case-preserved program value on the root tier', async () => {
    await request(app)
      .post('/SASLogon/login')
      .type('form')
      .send({ username: 'alice' })
      .expect(200)
    const res = await request(app)
      .get('/SASStoredProcess?%5fPrOgRaM=%2FCase%2FProgram')
      .expect(200)
    expect(res.text).toBe('correct program')
  })

  it('requires mock login for both GET endpoints', async () => {
    for (const route of ['/SASStoredProcess', '/SASStoredProcess/do']) {
      await request(app)
        .get(`${route}?_PROGRAM=/Case/Program`)
        .expect(302)
        .expect('Location', '/SASLogon/login')
    }
    expect(execute).not.toHaveBeenCalled()
  })

  it('requires mock login for POST when upload validation succeeds', async () => {
    await request(app)
      .post('/SASStoredProcess/do?_PROGRAM=/Case/Program')
      .expect(302)
      .expect('Location', '/SASLogon/login')
    expect(execute).not.toHaveBeenCalled()
  })

  it('accepts mixed-case query credentials for do GET without changing values', async () => {
    const res = await request(app)
      .get(
        '/SASStoredProcess/do?%5fUsErNaMe=Alice&_PASSWORD=SeCrEt&_PROGRAM=%2FCase%2FProgram&CuStOm=VaL%2Bue'
      )
      .expect(200)
    expect(res.text).toBe('executed')
    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({
        programPath: path.join(drive, 'files', 'Case', 'Program.js'),
        vars: expect.objectContaining({
          _username: 'Alice',
          _password: 'SeCrEt',
          _program: '/Case/Program',
          custom: 'VaL+ue',
          _requestMethod: 'GET'
        })
      })
    )
  })

  it('preserves duplicate GET values when names differ only by case', async () => {
    const res = await request(app)
      .get(
        '/SASStoredProcess/do?_USERNAME=alice&_PASSWORD=secret&_PROGRAM=/Case/Program&CuStOm=First%2BValue&custom=Second%20Value'
      )
      .expect(200)
    expect(res.text).toBe('executed')
    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({
        vars: expect.objectContaining({
          custom: ['First+Value', 'Second Value']
        })
      })
    )
  })

  it('normalizes POST names before upload validation without changing body fields', async () => {
    await request(app)
      .post('/SASLogon/login')
      .type('form')
      .send({ username: 'alice' })
      .expect(200)
    const res = await request(app)
      .post('/SASStoredProcess/do?_PROGRAM=%2FCase%2FProgram&CuStOm=VaL%2Bue')
      .send({ BodyField: 'BodyValue' })
      .expect(200)
    expect(res.text).toBe('executed')
    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({
        vars: expect.objectContaining({
          _program: '/Case/Program',
          custom: 'VaL+ue',
          BodyField: 'BodyValue',
          _requestMethod: 'POST'
        })
      })
    )
  })

  it('preserves duplicate POST names for validation', async () => {
    await request(app)
      .post('/SASLogon/login')
      .type('form')
      .send({ username: 'alice' })
      .expect(200)
    const res = await request(app)
      .post(
        '/SASStoredProcess/do?_program=/Case/Program&_PROGRAM=/Case/Program'
      )
      .expect(400)
    expect(res.text).toContain('_program')
    expect(execute).not.toHaveBeenCalled()
  })

  it('does not bypass the public-account POST restriction', async () => {
    await request(app)
      .post('/SASLogon/login')
      .type('form')
      .send({ username: 'PUBLIC' })
      .expect(200)
    await request(app)
      .post('/SASStoredProcess/do?_PROGRAM=/Case/Program')
      .expect(302)
      .expect('Location', '/SASLogon/Login')
    expect(execute).not.toHaveBeenCalled()
  })
})
