import express from 'express'
import request from 'supertest'
import { createDriveService, MemoryDriveStore } from '@sasjs/api'
import { authenticateAccessToken } from '../../../middlewares/authenticateToken'
import { authorize } from '../../../middlewares/authorize'
import { localJesRouter } from '../localJes'
import { createViyaRouter, viyaGuard } from '../index'

const id = '12345678-1234-4123-8123-123456789abc'
const reserved = `.sasjs-viya-job-${id}.json`
const secret = JSON.stringify({
  id,
  name: 'secret-definition',
  code: '%put confidential;',
  type: 'Compute',
  parameters: [],
  links: []
})

const mount = (guard?: express.RequestHandler, includeReserved = true) => {
  const app = express()
  const drive = createDriveService(
    new MemoryDriveStore({
      ...(includeReserved ? { [`/protected/${reserved}`]: secret } : {}),
      '/protected/ordinary.txt': 'ordinary'
    })
  )
  const read = jest.spyOn(drive, 'read')
  if (guard) app.use(guard)
  app.use(
    createViyaRouter(() => ({ drive, viya: { serverUrl: 'http://localhost' } }))
  )
  return { app, read }
}

const members = async (app: express.Express) => {
  const folder = await request(app)
    .get('/folders/folders/@item')
    .query({ path: '/protected' })
  expect(folder.status).toBe(200)
  return request(app).get(`/folders/folders/${folder.body.id}/members`)
}

describe('Viya member metadata on supported mounts', () => {
  const mode = process.env.MODE
  const registry = process.env.LOCAL_VIYA_JS_JOBS
  beforeEach(() => {
    process.env.MODE = 'desktop'
    process.env.LOCAL_VIYA_JS_JOBS = JSON.stringify({
      '/protected/registry-job': '/protected/job.js'
    })
  })
  afterAll(() => {
    if (mode === undefined) delete process.env.MODE
    else process.env.MODE = mode
    if (registry === undefined) delete process.env.LOCAL_VIYA_JS_JOBS
    else process.env.LOCAL_VIYA_JS_JOBS = registry
  })

  it('hides reserved definitions on an unguarded router', async () => {
    const { app, read } = mount()
    const response = await members(app)
    expect(response.status).toBe(200)
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'ordinary.txt' })
      ])
    )
    expect(JSON.stringify(response.body)).not.toContain(id)
    expect(JSON.stringify(response.body)).not.toContain(reserved)
    expect(JSON.stringify(response.body)).not.toContain('registry-job')
    expect(read).not.toHaveBeenCalled()
  })

  it('does not expose the reserved filename to a folder-only guarded caller', async () => {
    const { app, read } = mount(
      viyaGuard(
        (_req, _res, next) => next(),
        (_req, _res, next) => next(),
        async () => false
      )
    )
    const response = await members(app)
    expect(response.status).toBe(200)
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'ordinary.txt' })
      ])
    )
    expect(response.body.count).toBe(1)
    expect(JSON.stringify(response.body)).not.toContain(reserved)
    expect(JSON.stringify(response.body)).not.toContain(id)
    expect(read).not.toHaveBeenCalled()
  })

  it('preserves registry discovery with the real authenticated desktop admin', async () => {
    const { app } = mount(viyaGuard(authenticateAccessToken, authorize), false)
    const response = await members(app)
    expect(response.status).toBe(200)
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'registry-job', type: 'jobDefinition' })
      ])
    )
  })
  it('allows a trusted no-user permission decision without assuming a user', async () => {
    const { app } = mount(
      viyaGuard(
        (_req, _res, next) => next(),
        (_req, _res, next) => next(),
        async () => true
      ),
      false
    )
    const response = await members(app)
    expect(response.status).toBe(200)
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'registry-job', type: 'jobDefinition' })
      ])
    )
  })

  it('defaults to no metadata when a no-user guard supplies no file decision', async () => {
    const { app, read } = mount(
      viyaGuard(
        (_req, _res, next) => next(),
        (_req, _res, next) => next()
      )
    )
    const response = await members(app)
    expect(response.status).toBe(200)
    expect(JSON.stringify(response.body)).not.toContain('registry-job')
    expect(JSON.stringify(response.body)).not.toContain(reserved)
    expect(read).not.toHaveBeenCalled()
  })

  it('does not let metadata opt-in override a denied folder gate', async () => {
    const { app } = mount(
      viyaGuard(
        (_req, _res, next) => next(),
        (_req, res) => {
          res.sendStatus(403)
        },
        async () => true
      )
    )
    const response = await request(app).get('/folders/folders/some-id/members')
    expect(response.status).toBe(403)
  })

  it('does not expose registry definitions on an unguarded JES mount', async () => {
    const app = express()
    app.use(localJesRouter)
    const registryId = Buffer.from('/protected/registry-job').toString(
      'base64url'
    )
    const response = await request(app).get(
      `/jobDefinitions/definitions/${registryId}`
    )
    expect(response.status).toBe(401)
    expect(JSON.stringify(response.body)).not.toContain('registry-job')
  })

  it('does not dispatch definitions on an unguarded router', async () => {
    const { app, read } = mount()
    const response = await request(app).get(`/jobDefinitions/definitions/${id}`)
    expect(response.status).toBe(401)
    expect(read).not.toHaveBeenCalled()
  })
})
