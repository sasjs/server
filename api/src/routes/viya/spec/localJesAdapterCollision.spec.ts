import express from 'express'
import { Server } from 'http'
import request from 'supertest'
import { createDriveService, MemoryDriveStore } from '@sasjs/api'
import { SASViyaApiClient } from '@sasjs/adapter/node'
import { RequestClient } from '@sasjs/adapter/request/RequestClient'
import { authenticateAccessToken } from '../../../middlewares/authenticateToken'
import { authorize } from '../../../middlewares/authorize'
import { createViyaRouter, viyaGuard } from '../index'
import { localJesRouter } from '../localJes'

jest.unmock('axios')

// Exercise the installed adapter's actual discovery and first-match selection.
// Its transport uses real loopback HTTP against the guarded, mounted Server routes.

describe('registered twin collision through the installed adapter', () => {
  const savedMode = process.env.MODE
  const savedJobs = process.env.LOCAL_VIYA_JS_JOBS
  let listener: Server
  beforeEach(() => {
    process.env.MODE = 'desktop'
    process.env.LOCAL_VIYA_JS_JOBS = JSON.stringify({
      '/folder/job': '/folder/job.js'
    })
  })
  afterEach(async () => {
    if (listener)
      await new Promise<void>((resolve) => listener.close(() => resolve()))
  })
  afterAll(() => {
    if (savedMode === undefined) delete process.env.MODE
    else process.env.MODE = savedMode
    if (savedJobs === undefined) delete process.env.LOCAL_VIYA_JS_JOBS
    else process.env.LOCAL_VIYA_JS_JOBS = savedJobs
  })

  it('discovers a persisted definition and submits its original code', async () => {
    const app = express()
    const id = '12345678-1234-4123-8123-123456789abc'
    const record = JSON.stringify({
      id,
      name: 'job',
      code: '%put persisted;',
      type: 'Compute',
      parameters: [],
      links: []
    })
    const drive = createDriveService(
      new MemoryDriveStore({ [`/folder/.sasjs-viya-job-${id}.json`]: record })
    )
    app.use(viyaGuard(authenticateAccessToken, authorize))
    app.use(
      localJesRouter,
      createViyaRouter(() => ({ drive }))
    )
    listener = app.listen(0, '127.0.0.1')
    await new Promise<void>((resolve) => listener.once('listening', resolve))
    const address = listener.address()
    if (!address || typeof address === 'string') throw new Error('No listener')
    const base = `http://127.0.0.1:${address.port}`
    const client = new SASViyaApiClient(
      base,
      '/folder',
      'mock',
      new RequestClient(base)
    )
    const execute = jest
      .spyOn(client, 'executeScript')
      .mockResolvedValue({} as any)
    await client.executeComputeJob(
      '/folder/job',
      'mock',
      false,
      null,
      undefined
    )
    expect(execute).toHaveBeenCalledTimes(1)
    expect(execute.mock.calls[0][1]).toEqual(['%put persisted;'])
    expect(
      (await drive.read(`/folder/.sasjs-viya-job-${id}.json`)).contents
    ).toBe(record)
  })

  it('rejects JES discovery of a same-name ordinary file', async () => {
    const app = express()
    const drive = createDriveService(
      new MemoryDriveStore({ '/folder/job': 'ordinary' })
    )
    const requests: string[] = []
    app.use((req, _res, next) => {
      requests.push(`${req.method} ${req.path}`)
      next()
    })
    app.use(viyaGuard(authenticateAccessToken, authorize))
    app.use(
      localJesRouter,
      createViyaRouter(() => ({ drive }))
    )
    listener = app.listen(0, '127.0.0.1')
    await new Promise<void>((resolve) => listener.once('listening', resolve))
    const address = listener.address()
    if (!address || typeof address === 'string') throw new Error('No listener')
    const base = `http://127.0.0.1:${address.port}`
    const client = new SASViyaApiClient(
      base,
      '/folder',
      'mock',
      new RequestClient(base)
    )
    await expect(
      client.executeJob('/folder/job', 'mock', false, null, undefined)
    ).rejects.toThrow('status code 409')
    expect(requests).toHaveLength(2)
    expect(requests[0]).toBe('GET /folders/folders/@item')
    expect(requests[1]).toMatch(/^GET \/folders\/folders\/[^/]+\/members$/)
  })

  it('refuses a same-name ordinary file before the adapter selects it', async () => {
    const app = express()
    const drive = createDriveService(
      new MemoryDriveStore({ '/folder/job': 'not code' })
    )
    app.use(viyaGuard(authenticateAccessToken, authorize))
    app.use(
      localJesRouter,
      createViyaRouter(() => ({ drive }))
    )
    listener = app.listen(0, '127.0.0.1')
    await new Promise<void>((resolve) => listener.once('listening', resolve))
    const address = listener.address()
    if (!address || typeof address === 'string') throw new Error('No listener')
    const base = `http://127.0.0.1:${address.port}`
    const client = new SASViyaApiClient(
      base,
      '/folder',
      'mock',
      new RequestClient(base)
    )
    const execute = jest.spyOn(client, 'executeScript')
    await expect(
      client.executeComputeJob('/folder/job', 'mock', false, null, undefined)
    ).rejects.toThrow('status code 409')
    expect(execute).not.toHaveBeenCalled()
    const folder = await request(app)
      .get('/folders/folders/@item')
      .query({ path: '/folder' })
      .expect(200)
    await request(app)
      .get(`/folders/folders/${folder.body.id}/members`)
      .query({ start: 1, limit: 1 })
      .expect(409)
  })
})
