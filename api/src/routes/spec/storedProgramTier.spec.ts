import path from 'path'
import { createFile, deleteFolder } from '@sasjs/utils'
import { Express } from 'express'
import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'

import * as fileUtilModules from '../../utils/file'

const tmpFolder = path.join(process.cwd(), `tmp-tier-${process.pid}`)
const driveFolder = path.join(tmpFolder, 'files')

jest
  .spyOn(fileUtilModules, 'getFilesFolder')
  .mockImplementation(() => driveFolder)
jest
  .spyOn(fileUtilModules, 'getAppStreamConfigPath')
  .mockImplementation(() => path.join(tmpFolder, 'appStreamConfig.json'))

import appPromise from '../../app'
import { UserController } from '../../controllers/'
import { generateAccessToken, saveTokensInDB } from '../../utils'
import { RunTimeType } from '../../utils'

const clientId = 'someclientID'
const appLoc = '/Public/app'

/**
 * `/StoredProgram` stands where `/SASStoredProcess` and `/SASJobExecution`
 * stand, so it speaks the same two parameters they do: `_FILE=` for a file to
 * read, `_program=` for a program to run.
 *
 * What is pinned here is the routing - that `_program=` reaches the operation
 * that executes one (rather than the web shell, which answers every unmatched
 * path with 200), that the method travels, and that naming both parameters is
 * refused instead of silently choosing one. What a run *does* is the STP suite's
 * business.
 */
describe('the StoredProgram tier', () => {
  let app: Express
  let con: Mongoose
  let mongoServer: MongoMemoryServer
  let token: string

  beforeAll(async () => {
    app = await appPromise

    // a tier that runs a program needs a runtime; without one the execute route
    // fails on its own configuration and the test would prove nothing about
    // routing
    process.runTimes = [RunTimeType.JS]

    mongoServer = await MongoMemoryServer.create()
    con = await mongoose.connect(mongoServer.getUri())

    const userController = new UserController()
    await userController.createUser({
      displayName: 'Tier Admin',
      username: 'tierAdmin',
      password: 'adminPassword',
      isAdmin: true,
      isActive: true
    })

    const user = await userController.getUserByUsername(
      { user: { isAdmin: false } } as any,
      'tierAdmin'
    )
    token = generateAccessToken({ clientId, userId: user.uid })
    await saveTokensInDB(user.uid, clientId, token, 'refreshToken')

    await createFile(
      path.join(driveFolder, 'Public', 'app', 'services', 'web', 'main.js'),
      'console.log("streamed")'
    )
  })

  afterAll(async () => {
    await deleteFolder(tmpFolder)
    await con.connection.dropDatabase()
    await con.connection.close()
    await mongoServer.stop()
  })

  it('routes _program to the operation that runs one, not to the shell', async () => {
    // the program is not on the drive, so the run refuses - the point is that
    // the refusal comes from the execute route (a 4xx naming the program) and
    // not from the web router, which answers an unmatched GET with the shell
    const res = await request(app)
      .get(`/StoredProgram?_program=${appLoc}/services/web/not-here`)
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(400)
    // the execute route's own words, naming the program it could not find - so
    // the request reached it rather than the web shell
    expect(res.text).toContain(
      'The Program at (/Public/app/services/web/not-here) does not exist.'
    )
  })

  it('carries the method through, so a posted program stays a post', async () => {
    const res = await request(app)
      .post(`/StoredProgram?_program=${appLoc}/services/web/not-here`)
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(400)
    expect(res.text).toContain('does not exist')
  })

  it('refuses a request that names a program and a file at once', async () => {
    const res = await request(app)
      .get(
        `/StoredProgram?_program=${appLoc}/services/web/main&_FILE=${appLoc}/services/web/main.js`
      )
      .auth(token, { type: 'bearer' })
      .expect(400)

    expect(res.text).toEqual(
      'Exactly one of "_program" and "_FILE" may be given.'
    )
  })

  it('still answers _FILE on the same tier', async () => {
    const res = await request(app)
      .get(`/StoredProgram?_FILE=${appLoc}/services/web/main.js`)
      .auth(token, { type: 'bearer' })
      .expect(200)

    expect(res.headers['content-type']).toContain('javascript')
    expect(res.text).toEqual('console.log("streamed")')
  })
})
