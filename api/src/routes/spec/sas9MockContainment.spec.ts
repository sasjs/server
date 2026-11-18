import express from 'express'
import fs from 'fs'
import os from 'os'
import path from 'path'
import request from 'supertest'

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sas9-containment-'))
const mocks = path.join(root, 'mocks')
const oldLocation = process.env.STATIC_MOCK_LOCATION
process.env.STATIC_MOCK_LOCATION = mocks

import sas9WebRouter from '../web/sas9-web'

const app = express()
app.use('/', sas9WebRouter)

describe('SAS 9 mock root response containment', () => {
  const oldLogger = process.logger
  let symlinksSupported = false

  beforeAll(async () => {
    fs.mkdirSync(path.join(mocks, 'sas9', 'generic'), { recursive: true })
    fs.mkdirSync(path.join(mocks, 'sas9', 'custom'), { recursive: true })
    fs.mkdirSync(path.join(root, 'outside'), { recursive: true })
    fs.writeFileSync(
      path.join(mocks, 'sas9', 'generic', 'logged-in'),
      'logged in'
    )
    const defaultFixture = fs.readFileSync(
      path.join(process.cwd(), 'mocks', 'sas9', 'generic', 'sas-stored-process')
    )
    fs.writeFileSync(
      path.join(mocks, 'sas9', 'generic', 'sas-stored-process'),
      defaultFixture
    )
    fs.writeFileSync(
      path.join(mocks, 'sas9', 'custom', 'program'),
      'program fixture'
    )
    fs.writeFileSync(path.join(mocks, 'secret'), 'MOCK-BASE-SECRET')
    fs.mkdirSync(path.join(mocks, 'sas9-other'))
    fs.writeFileSync(path.join(mocks, 'sas9-other', 'secret'), 'SIBLING-SECRET')
    fs.writeFileSync(path.join(root, 'outside', 'secret'), 'OUTSIDE-SECRET')
    try {
      fs.symlinkSync(
        path.join(root, 'outside'),
        path.join(mocks, 'sas9', 'link'),
        'dir'
      )
      fs.symlinkSync(
        path.join(root, 'outside', 'secret'),
        path.join(mocks, 'sas9', 'file-link'),
        'file'
      )
      symlinksSupported = true
    } catch (error: any) {
      if (!['EPERM', 'EACCES', 'ENOSYS'].includes(error.code)) throw error
    }
    process.logger = {
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn()
    } as any
    await request(app)
      .post('/SASLogon/login')
      .type('form')
      .send({ username: 'alice' })
      .expect(200)
  })

  afterAll(() => {
    process.logger = oldLogger
    if (oldLocation === undefined) delete process.env.STATIC_MOCK_LOCATION
    else process.env.STATIC_MOCK_LOCATION = oldLocation
    fs.rmSync(root, { recursive: true, force: true })
  })

  it('still reads default and nested program fixtures', async () => {
    expect((await request(app).get('/SASStoredProcess').expect(200)).text).toBe(
      fs.readFileSync(
        path.join(mocks, 'sas9', 'generic', 'sas-stored-process'),
        'utf8'
      )
    )
    expect(
      (
        await request(app)
          .get('/SASStoredProcess?_program=%2Fcustom%2Fprogram')
          .expect(200)
      ).text
    ).toBe('program fixture')
  })

  it('does not read encoded traversal outside the sas9 mock root', async () => {
    for (const [program, secret] of [
      ['/../secret', 'MOCK-BASE-SECRET'],
      ['/../sas9-other/secret', 'SIBLING-SECRET'],
      ['/../../outside/secret', 'OUTSIDE-SECRET']
    ]) {
      const response = await request(app).get(
        `/SASStoredProcess?_program=${encodeURIComponent(program)}`
      )
      expect(response.text).not.toContain(secret)
    }
  })

  it('does not follow symlinks to outside files or directories', async () => {
    if (!symlinksSupported) return
    for (const program of ['/link/secret', '/file-link']) {
      const response = await request(app).get(
        `/SASStoredProcess?_program=${encodeURIComponent(program)}`
      )
      expect(response.text).not.toContain('OUTSIDE-SECRET')
    }
  })
})
