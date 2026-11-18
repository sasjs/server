import express from 'express'
import fs from 'fs'
import os from 'os'
import path from 'path'
import request from 'supertest'

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sas9-login-'))
const oldLocation = process.env.STATIC_MOCK_LOCATION
process.env.STATIC_MOCK_LOCATION = root
const sas9WebRouter = require('../web/sas9-web').default

const app = express()
app.use(express.json())
app.use(sas9WebRouter)

describe('SAS 9 mock login input', () => {
  beforeAll(() => {
    fs.mkdirSync(path.join(root, 'sas9', 'generic'), { recursive: true })
    for (const name of ['logged-in', 'logged-out', 'sas-stored-process']) {
      fs.writeFileSync(path.join(root, 'sas9', 'generic', name), name)
    }
  })

  beforeEach(async () => {
    await request(app).get('/SASLogon/logout').expect(200)
  })

  afterAll(() => {
    fs.rmSync(root, { recursive: true, force: true })
    if (oldLocation === undefined) delete process.env.STATIC_MOCK_LOCATION
    else process.env.STATIC_MOCK_LOCATION = oldLocation
  })

  it.each([{}, ['alice'], true, 42, null])(
    'rejects a non-string login username %j without breaking later POSTs',
    async (username) => {
      const login = await request(app)
        .post('/SASLogon/login')
        .send({ username })
      await request(app)
        .post('/SASStoredProcess/do')
        .send({})
        .expect(302)
        .expect('Location', '/SASLogon/login')
      expect(login.status).toBe(302)
      expect(login.headers.location).toBe('/SASLogon/login')
    }
  )

  it('rejects a login with no body', async () => {
    await request(app)
      .post('/SASLogon/login')
      .expect(302)
      .expect('Location', '/SASLogon/login')
    await request(app)
      .post('/SASStoredProcess/do')
      .expect(302)
      .expect('Location', '/SASLogon/login')
  })

  it('rejects a nested form username', async () => {
    await request(app)
      .post('/SASLogon/login')
      .type('form')
      .send('username[name]=alice')
      .expect(302)
      .expect('Location', '/SASLogon/login')
    await request(app)
      .post('/SASStoredProcess/do')
      .expect(302)
      .expect('Location', '/SASLogon/login')
  })

  it('preserves the current public login when a malformed login is rejected', async () => {
    await request(app)
      .post('/SASLogon/login')
      .type('form')
      .send({ username: 'PUBLIC' })
      .expect(200)
    await request(app)
      .post('/SASLogon/login')
      .send({ username: {} })
      .expect(302)
      .expect('Location', '/SASLogon/login')
    await request(app)
      .post('/SASStoredProcess/do')
      .send({})
      .expect(302)
      .expect('Location', '/SASLogon/Login')
  })

  it('accepts query credentials on the fixture GET without a request body', async () => {
    const response = await request(app)
      .get('/SASStoredProcess?%5fUsErNaMe=PUBLIC&_PASSWORD=secret')
      .expect(200)
    expect(response.text).toBe('sas-stored-process')
    await request(app)
      .post('/SASStoredProcess/do')
      .expect(302)
      .expect('Location', '/SASLogon/Login')
  })

  it('uses the query username rather than an unrelated GET body username', async () => {
    await request(app)
      .get('/SASStoredProcess?_username=PUBLIC&_password=secret')
      .send({ username: 'alice' })
      .expect(200)
    await request(app)
      .post('/SASStoredProcess/do')
      .expect(302)
      .expect('Location', '/SASLogon/Login')
  })

  it('does not accept a missing query credential', async () => {
    await request(app)
      .get('/SASStoredProcess?_username=alice')
      .send({ username: 'alice' })
      .expect(302)
      .expect('Location', '/SASLogon/login')
    await request(app)
      .post('/SASStoredProcess/do')
      .send({})
      .expect(302)
      .expect('Location', '/SASLogon/login')
  })
})
