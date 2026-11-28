import express from 'express'
import request from 'supertest'
import { createDriveService, MemoryDriveStore } from '@sasjs/api'
import { createViyaRouter, viyaGuard } from '../index'
import { localJesRouter } from '../localJes'

const boot = (files: Record<string, string>, canReadMetadata = true) => {
  const app = express()
  const drive = createDriveService(new MemoryDriveStore(files))
  app.use(
    viyaGuard(
      (_req, _res, next) => next(),
      (_req, _res, next) => next(),
      async () => canReadMetadata
    )
  )
  app.use(
    localJesRouter,
    createViyaRouter(() => ({ drive }))
  )
  return { app, drive }
}

const folderId = async (app: express.Express, path: string) => {
  const folder = await request(app)
    .get('/folders/folders/@item')
    .query({ path })
  expect(folder.status).toBe(200)
  return folder.body.id as string
}

describe('local JES member pagination with installed API', () => {
  const mode = process.env.MODE
  const registry = process.env.LOCAL_VIYA_JS_JOBS
  beforeEach(() => {
    process.env.MODE = 'desktop'
    process.env.LOCAL_VIYA_JS_JOBS = JSON.stringify({
      '/folder/job': '/folder/job.js'
    })
  })
  afterAll(() => {
    if (mode === undefined) delete process.env.MODE
    else process.env.MODE = mode
    if (registry === undefined) delete process.env.LOCAL_VIYA_JS_JOBS
    else process.env.LOCAL_VIYA_JS_JOBS = registry
  })

  it('pages the combined Drive and registered members exactly once', async () => {
    const { app } = boot({ '/folder/a.txt': 'a', '/folder/b.txt': 'b' })
    const id = await folderId(app, '/folder')
    const all = await request(app).get(`/folders/folders/${id}/members`)
    expect(all.status).toBe(200)
    expect(all.body.items.map((item: any) => item.name)).toEqual([
      'a.txt',
      'b.txt',
      'job'
    ])
    for (let start = 0; start < 4; start++) {
      const page = await request(app)
        .get(`/folders/folders/${id}/members`)
        .query({ start, limit: 1 })
      expect(page.status).toBe(200)
      expect(page.body).toMatchObject({
        start,
        limit: 1,
        count: start < 3 ? 1 : 0,
        items: all.body.items.slice(start, start + 1)
      })
    }
    const page = await request(app)
      .get(`/folders/folders/${id}/members`)
      .query({ start: 1, limit: 2 })
    expect(page.body).toMatchObject({
      start: 1,
      limit: 2,
      count: 2,
      items: all.body.items.slice(1, 3)
    })
  })

  it('fails closed before paging when a Drive filename collides with a registry name', async () => {
    const { app } = boot({ '/folder/job': 'ordinary file' })
    const id = await folderId(app, '/folder')
    const pages = await Promise.all(
      [0, 1, 2].map((start) =>
        request(app)
          .get(`/folders/folders/${id}/members/`)
          .query({ start, limit: 1 })
      )
    )
    expect(pages.map((page) => page.status)).toEqual([409, 409, 409])
  })

  it('does not reveal a collision to a folder-only caller', async () => {
    const { app, drive } = boot(
      {
        '/folder/job': 'ordinary file',
        '/folder/.sasjs-viya-job-12345678-1234-4123-8123-123456789abc.json':
          'secret'
      },
      false
    )
    const read = jest.spyOn(drive, 'read')
    const id = await folderId(app, '/folder')
    const page = await request(app)
      .get(`/folders/folders/${id}/members`)
      .query({ limit: 1 })
      .expect(200)
    expect(page.body.items.map((item: any) => item.name)).toEqual(['job'])
    expect(JSON.stringify(page.body)).not.toContain('sasjs-viya-job')
    expect(read).not.toHaveBeenCalled()
  })

  it('refuses a same-name child folder before paging', async () => {
    const { app } = boot({ '/folder/job/inside.txt': 'file' })
    const id = await folderId(app, '/folder')
    await request(app).get(`/folders/folders/${id}/members`).expect(409)
  })

  it('discovers a matching persisted definition once without changing its metadata', async () => {
    const definitionId = '12345678-1234-4123-8123-123456789abc'
    const definition = {
      id: definitionId,
      name: 'job',
      type: 'Compute',
      code: '%put original;',
      parameters: [],
      links: [],
      createdBy: 'owner',
      modifiedBy: 'editor',
      creationTimeStamp: 'original-time',
      modifiedTimeStamp: 'edited-time'
    }
    const record = JSON.stringify(definition)
    const file = `/folder/.sasjs-viya-job-${definitionId}.json`
    const { app, drive } = boot({ [file]: record })
    const id = await folderId(app, '/folder')
    const all = await request(app)
      .get(`/folders/folders/${id}/members`)
      .expect(200)
    expect(all.body.items).toHaveLength(1)
    expect(all.body.items[0]).toMatchObject({
      id: definitionId,
      name: 'job',
      contentType: 'jobDefinition'
    })
    for (const start of [0, 1, 10]) {
      const page = await request(app)
        .get(`/folders/folders/${id}/members`)
        .query({ start, limit: 1 })
        .expect(200)
      expect(page.body.items).toEqual(all.body.items.slice(start, start + 1))
    }
    const resource = await request(app)
      .get(`/jobDefinitions/definitions/${definitionId}`)
      .expect(200)
    expect(resource.body).toEqual(definition)
    expect((await drive.read(file)).contents).toBe(record)
    process.env.LOCAL_VIYA_JS_JOBS = '{}'
    const normal = await request(app)
      .get(`/folders/folders/${id}/members`)
      .expect(200)
    expect(normal.body.items).toEqual([
      expect.objectContaining({
        id: definitionId,
        name: 'job',
        createdBy: 'owner',
        modifiedBy: 'editor',
        uri: `/jobDefinitions/definitions/${definitionId}`
      })
    ])
  })

  it('filters reserved metadata and registry entries before paging for a folder-only caller', async () => {
    const { app, drive } = boot(
      {
        '/folder/.sasjs-viya-job-123.json': 'secret',
        '/folder/a.txt': 'a',
        '/folder/b.txt': 'b'
      },
      false
    )
    const read = jest.spyOn(drive, 'read')
    const id = await folderId(app, '/folder')
    const page = await request(app)
      .get(`/folders/folders/${id}/members`)
      .query({ start: 1, limit: 1 })
    expect(page.status).toBe(200)
    expect(page.body).toMatchObject({ start: 1, limit: 1, count: 1 })
    expect(page.body.items.map((item: any) => item.name)).toEqual(['b.txt'])
    expect(JSON.stringify(page.body)).not.toContain('sasjs-viya-job')
    expect(JSON.stringify(page.body)).not.toContain('jobDefinition')
    expect(read).not.toHaveBeenCalled()
  })

  it('handles empty folders, registry-only folders and unbounded or invalid starts', async () => {
    process.env.LOCAL_VIYA_JS_JOBS = JSON.stringify({ '/empty/job': '/job.js' })
    const { app, drive } = boot({
      '/empty/child/file': 'a',
      '/other/file': 'b'
    })
    await drive.mkdir('/vacant')
    await drive.mkdir('/registered')
    process.env.LOCAL_VIYA_JS_JOBS = JSON.stringify({
      '/empty/job': '/job.js',
      '/registered/only': '/job.js'
    })
    const vacant = await folderId(app, '/vacant')
    const emptyPage = await request(app)
      .get(`/folders/folders/${vacant}/members`)
      .query({ limit: 2 })
    expect(emptyPage.body).toMatchObject({
      start: 0,
      limit: 2,
      count: 0,
      items: []
    })
    const registryOnly = await folderId(app, '/registered')
    const only = await request(app)
      .get(`/folders/folders/${registryOnly}/members`)
      .query({ limit: 1 })
    expect(only.body).toMatchObject({ start: 0, limit: 1, count: 1 })
    expect(only.body.items.map((item: any) => item.name)).toEqual(['only'])
    const empty = await folderId(app, '/empty/child')
    // Start beyond all members, including for an empty result.
    const beyond = await request(app)
      .get(`/folders/folders/${empty}/members`)
      .query({ start: 5, limit: 2 })
    expect(beyond.body).toMatchObject({
      start: 5,
      limit: 2,
      count: 0,
      items: []
    })
    const other = await folderId(app, '/other')
    const noJobs = await request(app)
      .get(`/folders/folders/${other}/members`)
      .query({ start: -1, limit: 0 })
    expect(noJobs.body).toMatchObject({ start: 0, limit: 1, count: 1 })
    expect(noJobs.body.items.map((item: any) => item.name)).toEqual(['file'])
    const registered = await folderId(app, '/empty')
    const unbounded = await request(app)
      .get(`/folders/folders/${registered}/members`)
      .query({ start: 1 })
    expect(unbounded.body).toMatchObject({ start: 1, limit: 1, count: 1 })
    expect(unbounded.body.items.map((item: any) => item.name)).toEqual(['job'])
  })

  it('preserves dispatcher errors for a nonexistent folder', async () => {
    const { app } = boot({ '/folder/file': 'a' })
    const page = await request(app)
      .get('/folders/folders/not-a-folder/members')
      .query({ start: 1, limit: 1 })
    expect(page.status).toBe(404)
  })
})
