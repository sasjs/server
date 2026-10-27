import { Express } from 'express'
import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'

import { UserController } from '../../../controllers/'
import { generateAccessToken, saveTokensInDB } from '../../../utils'
import { sendError } from '../admin'

// MODE must be set BEFORE the app module is loaded: `setProcessVariables()`
// decides whether to install JWT secrets from the mode it sees at boot, and an
// app built in the default desktop mode leaves `process.secrets` undefined, so
// every token operation in this file would fail. Setting it after the import
// is too late - hence the require rather than an import statement.
const originalMode = process.env.MODE
const originalSasPath = process.env.SAS_PATH
const originalRunTimes = process.env.RUN_TIMES
process.env.MODE = 'server'
// Server mode validates the runtime it advertises. These tests never start a
// SAS session, so any existing path satisfies the check.
process.env.SAS_PATH = process.env.SAS_PATH || '/bin/true'
process.env.RUN_TIMES = process.env.RUN_TIMES || 'sas'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const appPromise: Promise<Express> = require('../../../app').default

const clientId = 'someclientID'

const adminUser = {
  displayName: 'Test Admin',
  username: 'testadminusername',
  password: '12345678',
  isAdmin: true,
  isActive: true
}

const plainUser = {
  displayName: 'Test User',
  username: 'testplainusername',
  password: '12345678',
  isAdmin: false,
  isActive: true
}

const controller = new UserController()

/**
 * Administration is for administrators.
 *
 * Two things are pinned here: the router is mounted at all (an unmatched
 * `/SASjsApi/*` path is answered by the Swagger handler with 200 and HTML, so
 * a missing mount would not 404), and `verifyAdmin` refuses an authenticated
 * caller who is not an admin - the case that separates this from every route
 * that merely requires a login.
 */
describe('admin routes', () => {
  let app: Express
  let con: Mongoose
  let mongoServer: MongoMemoryServer
  let adminAccessToken: string
  let plainAccessToken: string

  beforeAll(async () => {
    app = await appPromise

    // wiredTiger is specified explicitly: MongoMemoryServer's default
    // (`ephemeralForTest`) was removed in MongoDB 7.0.
    mongoServer = await MongoMemoryServer.create({
      instance: { storageEngine: 'wiredTiger' }
    })
    con = await mongoose.connect(mongoServer.getUri())

    adminAccessToken = await createUserAndToken(adminUser)
    plainAccessToken = await createUserAndToken(plainUser)
  })

  afterAll(async () => {
    await con.connection.dropDatabase()
    await con.connection.close()
    await mongoServer.stop()

    // Restore by deletion: assigning undefined stores the string "undefined"
    // and leaks into the sibling specs sharing this worker.
    const restore = (name: string, value: string | undefined) => {
      if (value === undefined) delete process.env[name]
      else process.env[name] = value
    }

    restore('MODE', originalMode)
    restore('SAS_PATH', originalSasPath)
    restore('RUN_TIMES', originalRunTimes)
  })

  it.each([
    '/SASjsApi/admin/diagnostics',
    '/SASjsApi/admin/logs',
    '/SASjsApi/admin/logs/20260101000000.log'
  ])('refuses an unauthenticated caller on %s', async (routePath) => {
    const res = await request(app).get(routePath)

    expect(res.status).toBe(401)
    expect(res.text).not.toContain('<html')
  })

  it('refuses a signed-in caller who is not an administrator', async () => {
    const res = await request(app)
      .get('/SASjsApi/admin/diagnostics')
      .auth(plainAccessToken, { type: 'bearer' })

    expect(res.status).toBe(401)
    expect(res.text).toBe('Admin account required')
  })

  it('answers diagnostics for an administrator', async () => {
    const res = await request(app)
      .get('/SASjsApi/admin/diagnostics')
      .auth(adminAccessToken, { type: 'bearer' })
      .expect(200)

    expect(res.body.build).toEqual(
      expect.objectContaining({ version: expect.any(String) })
    )
    expect(res.body.server).toEqual(
      expect.objectContaining({ mode: 'server', pid: process.pid })
    )
    expect(res.body.server.loadAverage).toHaveLength(3)
    expect(Array.isArray(res.body.folders)).toBe(true)
  })

  it('lists log files for an administrator', async () => {
    const res = await request(app)
      .get('/SASjsApi/admin/logs')
      .auth(adminAccessToken, { type: 'bearer' })
      .expect(200)

    expect(Array.isArray(res.body.files)).toBe(true)
  })

  it('refuses a log name that could escape the log folder', async () => {
    const res = await request(app)
      .get('/SASjsApi/admin/logs/%2e%2e%2f.env.log')
      .auth(adminAccessToken, { type: 'bearer' })

    // The name is refused, never read: 400 whichever guard fires first.
    expect(res.status).toBe(400)
  })
})

const createUserAndToken = async (user: any): Promise<string> => {
  const dbUser = await controller.createUser(user)

  return generateAndSaveToken(dbUser.uid)
}

/**
 * Error mapping in the router.
 *
 * A numeric `code` is not automatically an HTTP status - driver errors carry
 * 11000 and 13 - and `res.status(11000)` throws inside the handler, leaving the
 * caller with no response at all.
 */
describe('sendError', () => {
  // The app installs a winston logger on `process.logger`, so which sink the
  // error reaches depends on whether the app was booted.
  const spyOnErrorLog = () => {
    const logger = (process as any).logger

    return logger?.error
      ? jest.spyOn(logger, 'error').mockImplementation(() => {})
      : jest.spyOn(console, 'error').mockImplementation(() => {})
  }

  const restoreErrorLog = (spy: any) => spy.mockRestore()

  const fakeResponse = () => {
    const res: any = {}

    res.status = jest.fn(() => res)
    res.send = jest.fn(() => res)

    return res
  }

  it('passes a controller code through unchanged', () => {
    const res = fakeResponse()

    sendError(res, { code: 400, message: 'Invalid log file name.' })

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.send).toHaveBeenCalledWith('Invalid log file name.')
  })

  it('answers 500 for a numeric code that is not an HTTP status', () => {
    const res = fakeResponse()
    const logged = spyOnErrorLog()

    sendError(res, { code: 11000, message: 'E11000 duplicate key error' })

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.send).toHaveBeenCalledWith('Internal server error')
    // The original error must reach the log, not just the client's 500.
    expect(logged).toHaveBeenCalled()

    restoreErrorLog(logged)
  })

  it('answers 500 when there is no code at all', () => {
    const res = fakeResponse()
    const logged = spyOnErrorLog()

    sendError(res, new Error('EMFILE: too many open files'))

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.send).toHaveBeenCalledWith('Internal server error')
    expect(logged).toHaveBeenCalled()

    restoreErrorLog(logged)
  })
})

const generateAndSaveToken = async (userId: string) => {
  const accessToken = generateAccessToken({ clientId, userId })

  await saveTokensInDB(userId, clientId, accessToken, 'refreshToken')

  return accessToken
}
