import os from 'os'
import path from 'path'

import { LintConfig } from '@sasjs/lint'
import { createFile, createFolder } from '@sasjs/utils'
import { Express } from 'express'
import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'

import appPromise from '../../../app'
import { UserController } from '../../../controllers/'
import { generateAccessToken, saveTokensInDB } from '../../../utils/'
import {
  getDriveLintConfig,
  getDriveLintConfigObject
} from '../../../utils/lintConfig'

const clientId = 'lintConfigSpecClientID'

const user = {
  displayName: 'Lint Config Spec User',
  username: 'lintConfigSpecUsername',
  password: '87654321',
  isAdmin: false,
  isActive: true
}

/** The drive root's rules: what every file with no closer file resolves to. */
const rootRules = {
  indentation: 4,
  severityLevel: { indentation: 'error' }
}

/** A folder in the drive tree carrying its own rules. */
const projectRules = {
  indentation: 2,
  severityLevel: { indentation: 'warn' }
}

describe('GET /SASjsApi/code/lint-config', () => {
  let app: Express
  let con: Mongoose
  let mongoServer: MongoMemoryServer
  let accessToken: string
  let drive: string
  let originalDriveLoc: string

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create()
    process.env.DB_CONNECT = mongoServer.getUri()

    app = await appPromise

    con = await mongoose.connect(mongoServer.getUri())

    const userController = new UserController()
    const created = await userController.createUser(user)
    accessToken = generateAccessToken({
      clientId,
      userId: created.uid
    })
    await saveTokensInDB(created.uid, clientId, accessToken, 'refreshToken')
  })

  afterAll(async () => {
    await con.connection.dropDatabase()
    await con.connection.close()
    await mongoServer.stop()
  })

  beforeEach(async () => {
    originalDriveLoc = process.driveLoc

    drive = path.join(
      os.tmpdir(),
      `sasjs-lint-config-${Date.now()}-${Math.random().toString(36).slice(2)}`
    )

    await createFolder(path.join(drive, 'files', 'projects', 'app'))
    await createFile(
      path.join(drive, 'files', '.sasjslint'),
      JSON.stringify(rootRules)
    )
    await createFile(
      path.join(drive, 'files', 'projects', 'app', '.sasjslint'),
      JSON.stringify(projectRules)
    )
    await createFile(
      path.join(drive, 'files', 'projects', 'app', 'run.sas'),
      'data foo;\nrun;\n'
    )

    process.driveLoc = drive
  })

  afterEach(() => {
    process.driveLoc = originalDriveLoc
  })

  const get = (query = '') =>
    request(app)
      .get(`/SASjsApi/code/lint-config${query}`)
      .set('Authorization', `Bearer ${accessToken}`)

  it('requires a token', async () => {
    await request(app).get('/SASjsApi/code/lint-config').expect(401)
  })

  it("answers with the drive root's rules when no file is named", async () => {
    const res = await get().expect(200)

    expect(res.body).toEqual(rootRules)
  })

  it("answers with the nearest rules file at or above the file's folder", async () => {
    const res = await get('?filePath=/projects/app/run.sas').expect(200)

    expect(res.body).toEqual(projectRules)

    // a sibling folder with no rules of its own falls back to the root
    const sibling = await get('?filePath=/projects/other/run.sas').expect(200)

    expect(sibling.body).toEqual(rootRules)
  })

  it('answers with the root rules for a path that escapes the drive', async () => {
    const res = await get('?filePath=..%2F..%2Fetc%2Fpasswd').expect(200)

    expect(res.body).toEqual(rootRules)
    expect(JSON.stringify(res.body)).not.toContain('root:')
  })

  it('answers with the rules themselves, not a config wrapper', async () => {
    const res = await get('?filePath=/projects/app/run.sas').expect(200)

    // the client builds its own LintConfig: it gets the document, not an object
    // whose own properties are the config's internal state
    expect(res.body.source).toBeUndefined()
    expect(Object.keys(res.body).sort()).toEqual(
      Object.keys(projectRules).sort()
    )
  })

  it('is the same walk the lint and format routes use', async () => {
    // one implementation: the route's answer and the config the server lints
    // with must not drift, so the route's payload is checked by building the
    // config from it and comparing against the resolver's own output
    const res = await get('?filePath=/projects/app/run.sas').expect(200)

    expect(await getDriveLintConfigObject('/projects/app/run.sas')).toEqual(
      res.body
    )
    expect(new LintConfig(res.body).source).toEqual(
      (await getDriveLintConfig('/projects/app/run.sas')).source
    )
  })
})
