import express from 'express'
import { createDriveService, MemoryDriveStore } from '@sasjs/api'
import { configureBodyParsers } from '../../../app-modules'
import { createViyaRouter, viyaGuard } from '../index'
import { localJesRouter } from '../localJes'
import { privateRequest } from './privateRequest'

// This harness never listens, has a private store, and awaits each operation.
// The opt-in is a trusted fixture parameter, never derived from the request.
const boot = (allowIsolatedCreation = false) => {
  const app = express()
  const store = new MemoryDriveStore({ '/existing/untouched.txt': 'original' })
  const services = {
    drive: createDriveService(store),
    viya: {
      serverUrl: 'http://localhost:5000',
      ...(allowIsolatedCreation
        ? { allowUntransactionalJobDefinitionCreation: true }
        : {})
    }
  }
  configureBodyParsers(app)
  app.use(
    viyaGuard(
      (_req, _res, next) => next(),
      (_req, _res, next) => next()
    ),
    localJesRouter,
    createViyaRouter(() => services)
  )
  return { app, store }
}

const payload = {
  name: 'example',
  type: 'Compute',
  code: '%put hello;',
  parameters: []
}
const define = async (app: express.Express) => {
  const folder = await privateRequest(
    app,
    'POST',
    '/folders/folders?parentFolderUri=',
    { name: 'folder' }
  )
  expect(folder.status).toBe(201)
  const definition = await privateRequest(
    app,
    'POST',
    `/jobDefinitions/definitions?parentFolderUri=${encodeURIComponent(`/folders/folders/${folder.body.id}`)}`,
    payload
  )
  expect(definition.status).toBe(201)
  return definition.body
}

describe('job definition persistence mount', () => {
  const oldMode = process.env.MODE
  const oldRegistry = process.env.LOCAL_VIYA_JS_JOBS
  beforeEach(() => {
    process.env.MODE = 'desktop'
    delete process.env.LOCAL_VIYA_JS_JOBS
  })
  afterAll(() => {
    if (oldMode === undefined) delete process.env.MODE
    else process.env.MODE = oldMode
    if (oldRegistry === undefined) delete process.env.LOCAL_VIYA_JS_JOBS
    else process.env.LOCAL_VIYA_JS_JOBS = oldRegistry
  })

  it('refuses definition creation by default even for an authorised caller', async () => {
    const { app, store } = boot()
    const folder = await privateRequest(
      app,
      'GET',
      '/folders/folders/@item?path=%2Fexisting'
    )
    expect(folder.status).toBe(200)
    const before = store.dump()
    const response = await privateRequest(
      app,
      'POST',
      `/jobDefinitions/definitions?parentFolderUri=${encodeURIComponent(`/folders/folders/${folder.body.id}`)}`,
      payload
    )
    expect(response.status).toBe(501)
    expect(store.dump()).toEqual(before)
  })

  it('rejects caller supplied opt-in with the released API refusal and no mutation', async () => {
    const { app, store } = boot()
    const folder = await privateRequest(
      app,
      'GET',
      '/folders/folders/@item?path=%2Fexisting'
    )
    expect(folder.status).toBe(200)
    const before = store.dump()
    const response = await privateRequest(
      app,
      'POST',
      `/jobDefinitions/definitions?parentFolderUri=${encodeURIComponent(`/folders/folders/${folder.body.id}`)}&allowUntransactionalJobDefinitionCreation=true`,
      { ...payload, allowUntransactionalJobDefinitionCreation: true },
      { allowUntransactionalJobDefinitionCreation: 'true' }
    )
    expect(response.status).toBe(501)
    expect(response.body.message).toBe(
      'Job definition creation requires an isolated host opt-in; Drive mutations are not transactional.'
    )
    expect(store.dump()).toEqual(before)
  })

  it.each([false, true])(
    'creates and reads a persisted definition with registry enabled: %s',
    async (registry) => {
      if (registry) process.env.LOCAL_VIYA_JS_JOBS = '{}'
      const { app, store } = boot(true)
      const definition = await define(app)
      expect(
        store.dump()[`/folder/.sasjs-viya-job-${definition.id}.json`]
      ).toBeDefined()
      const read = await privateRequest(
        app,
        'GET',
        `/jobDefinitions/definitions/${definition.id}`
      )
      expect(read.status).toBe(200)
      expect(read.body).toMatchObject({
        id: definition.id,
        name: 'example',
        code: '%put hello;'
      })
    }
  )

  it('checks Drive file permission before a definition write', async () => {
    const app = express()
    let rule = ''
    app.use(
      viyaGuard(
        (_req, _res, next) => next(),
        (req, res) => {
          rule = req.url
          res.sendStatus(403)
        }
      )
    )
    app.use(
      createViyaRouter(() => ({
        drive: createDriveService(new MemoryDriveStore()),
        viya: { serverUrl: 'http://localhost:5000' }
      }))
    )
    const answer = await privateRequest(
      app,
      'POST',
      '/jobDefinitions/definitions',
      {}
    )
    expect(answer.status).toBe(403)
    expect(rule).toBe('/SASjsApi/drive/file')
  })
})
