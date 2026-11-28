import express, { Express } from 'express'
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'fs/promises'
import { serverDrive } from '../services'
import Permission from '../../../model/Permission'
import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { tmpdir } from 'os'
import { join } from 'path'
import request from 'supertest'
import { configureBodyParsers } from '../../../app-modules'
import {
  PermissionController,
  PermissionSettingForRoute,
  PermissionType,
  PrincipalType,
  UserController
} from '../../../controllers'
import { ModeType, SECRETS } from '../../../utils'
import { createDriveService, MemoryDriveStore } from '@sasjs/api'
import { authenticateAccessToken, authorize } from '../../../middlewares'
import { createViyaRouter, viyaGuard } from '../index'
import { privateRequest } from './privateRequest'
import { createServer, Server } from 'http'

const file = '/SASjsApi/drive/file'
const folder = '/SASjsApi/drive/folder'
const tree = '/SASjsApi/drive/fileTree'
const execute = '/SASjsApi/code/execute'
const body = {
  name: 'example',
  type: 'Compute',
  code: '%put secret;',
  parameters: []
}

describe('persisted job definition permissions on the mounted estate', () => {
  let app: Express
  let listener: Server
  let mongo: MongoMemoryServer
  let con: Mongoose
  let root: string
  let folderId: string
  let definitionId: string
  const tokens: Record<string, string> = {}
  const saved = {
    root: process.sasjsRoot,
    drive: process.driveLoc,
    logs: process.logsLoc,
    secrets: process.secrets,
    mode: process.env.MODE,
    emulation: process.env.EMULATE_VIYA
  }

  beforeAll(async () => {
    root = await mkdtemp(join(tmpdir(), 'definition-auth-'))
    process.sasjsRoot = root
    process.driveLoc = join(root, 'drive')
    process.logsLoc = join(root, 'logs')
    process.secrets = SECRETS
    process.env.MODE = ModeType.Server
    process.env.EMULATE_VIYA = 'true'
    await mkdir(join(root, 'drive', 'files'), { recursive: true })
    mongo = await MongoMemoryServer.create()
    con = await mongoose.connect(mongo.getUri())
    const users = new UserController()
    const permissions = new PermissionController()
    const roles: Record<string, string[]> = {
      admin: [],
      executor: [execute],
      complete: [file, folder, tree],
      nofile: [execute, folder, tree],
      nofolder: [execute, file, tree],
      notree: [execute, file, folder],
      reader: [file, tree],
      folderonly: [folder],
      fileonly: [file]
    }
    for (const [name, routes] of Object.entries(roles)) {
      const user = await users.createUser({
        username: name,
        displayName: name,
        password: 'authPassword',
        isAdmin: name === 'admin',
        isActive: true
      })
      for (const route of routes)
        await permissions.createPermission({
          path: route,
          type: PermissionType.route,
          setting: PermissionSettingForRoute.grant,
          principalType: PrincipalType.user,
          principalId: user.uid
        })
    }
    app = express()
    configureBodyParsers(app)
    const { setupRoutes } = await import('../../setupRoutes')
    setupRoutes(app)
    listener = createServer(app)
    await new Promise<void>((resolve, reject) => {
      listener.once('error', reject)
      listener.listen(0, '127.0.0.1', () => resolve())
    })
    expect(listener.address()).toMatchObject({ address: '127.0.0.1' })
    for (const name of Object.keys(roles)) {
      const response = await request(listener)
        .post('/SASLogon/oauth/token')
        .set(
          'Authorization',
          'Basic ' + Buffer.from('sas.cli:').toString('base64')
        )
        .type('form')
        .send({
          grant_type: 'password',
          username: name,
          password: 'authPassword'
        })
      expect(response.status).toBe(200)
      tokens[name] = response.body.access_token
    }
    const createdFolder = await request(listener)
      .post('/folders/folders')
      .set('Authorization', `Bearer ${tokens.admin}`)
      .query({ parentFolderUri: '' })
      .send({ name: 'protected' })
    expect(createdFolder.status).toBe(201)
    folderId = createdFolder.body.id
    // Seed the isolated Drive directly; the production mount deliberately does
    // not opt into nontransactional definition creation.
    definitionId = '12345678-1234-4123-8123-123456789abc'
    await writeFile(
      join(
        root,
        'drive',
        'files',
        'protected',
        `.sasjs-viya-job-${definitionId}.json`
      ),
      JSON.stringify({ ...body, id: definitionId, links: [] })
    )
    await mkdir(join(root, 'drive', 'files', 'protected', 'child'))
    await writeFile(
      join(root, 'drive', 'files', 'protected', 'ordinary.txt'),
      'hello'
    )
  }, 60000)

  afterAll(async () => {
    if (listener?.listening)
      await new Promise<void>((resolve, reject) =>
        listener.close((error) => (error ? reject(error) : resolve()))
      )
    if (con) {
      await con.connection.dropDatabase()
      await con.connection.close()
    }
    if (mongo) await mongo.stop()
    if (root) await rm(root, { recursive: true, force: true })
    process.sasjsRoot = saved.root
    process.driveLoc = saved.drive
    process.logsLoc = saved.logs
    process.secrets = saved.secrets
    if (saved.mode === undefined) delete process.env.MODE
    else process.env.MODE = saved.mode
    if (saved.emulation === undefined) delete process.env.EMULATE_VIYA
    else process.env.EMULATE_VIYA = saved.emulation
  })

  const read = (role: string) =>
    request(listener)
      .get(`/jobDefinitions/definitions/${definitionId}`)
      .set('Authorization', `Bearer ${tokens[role]}`)
  const create = (role: string) =>
    request(listener)
      .post('/jobDefinitions/definitions')
      .set('Authorization', `Bearer ${tokens[role]}`)
      .query({ parentFolderUri: `/folders/folders/${folderId}` })
      .send({ ...body, name: `created-${role}` })

  it.each(['executor', 'nofile', 'nofolder', 'notree', 'fileonly'])(
    'refuses definition reads to %s',
    async (role) => {
      const readSpy = jest.spyOn(serverDrive(), 'read')
      try {
        expect((await read(role)).status).toBe(401)
        expect(readSpy).not.toHaveBeenCalled()
      } finally {
        readSpy.mockRestore()
      }
    }
  )
  it.each(['executor', 'nofile', 'nofolder', 'notree'])(
    'refuses definition writes to %s without changing files',
    async (role) => {
      const dir = join(root, 'drive', 'files', 'protected')
      const before = await readdir(dir)
      const seeded = await readFile(
        join(dir, `.sasjs-viya-job-${definitionId}.json`),
        'utf8'
      )
      expect((await create(role)).status).toBe(401)
      expect(await readdir(dir)).toEqual(before)
      expect(
        await readFile(
          join(dir, `.sasjs-viya-job-${definitionId}.json`),
          'utf8'
        )
      ).toBe(seeded)
    }
  )
  it('allows a Drive reader without execute permission', async () => {
    const response = await read('complete')
    expect(response.status).toBe(200)
    expect(response.body.code).toBe(body.code)
  })
  it('enforces the real grant matrix before isolated creation and readback', async () => {
    const store = new MemoryDriveStore({
      '/private/untouched.txt': 'original'
    })
    const privateApp = express()
    configureBodyParsers(privateApp)
    privateApp.use(
      viyaGuard(authenticateAccessToken, authorize),
      createViyaRouter(() => ({
        drive: createDriveService(store),
        viya: {
          serverUrl: 'http://localhost',
          allowUntransactionalJobDefinitionCreation: true
        }
      }))
    )
    const call = (
      role: string,
      method: string,
      path: string,
      payload?: unknown
    ) =>
      privateRequest(privateApp, method, path, payload, {
        Authorization: `Bearer ${tokens[role]}`
      })
    const folderResponse = await call(
      'admin',
      'GET',
      '/folders/folders/@item?path=%2Fprivate'
    )
    expect(folderResponse.status).toBe(200)
    const path = `/jobDefinitions/definitions?parentFolderUri=${encodeURIComponent(`/folders/folders/${folderResponse.body.id}`)}`
    for (const role of [
      'executor',
      'nofile',
      'nofolder',
      'notree',
      'fileonly'
    ]) {
      const before = store.dump()
      expect(
        (await call(role, 'POST', path, { ...body, name: `created-${role}` }))
          .status
      ).toBe(401)
      expect(store.dump()).toEqual(before)
    }
    for (const role of ['complete', 'admin']) {
      const name = `created-${role}`
      const created = await call(role, 'POST', path, { ...body, name })
      expect(created.status).toBe(201)
      expect(
        store.dump()[`/private/.sasjs-viya-job-${created.body.id}.json`]
      ).toBeDefined()
      const readback = await call(
        role,
        'GET',
        `/jobDefinitions/definitions/${created.body.id}`
      )
      expect(readback.status).toBe(200)
      expect(readback.body).toMatchObject({ name, code: body.code })
    }
  })
  it('refuses even an authorised Drive writer while creation is disabled', async () => {
    const dir = join(root, 'drive', 'files', 'protected')
    const before = await readdir(dir)
    const definitionPath = join(dir, `.sasjs-viya-job-${definitionId}.json`)
    const contents = await readFile(definitionPath, 'utf8')
    const response = await create('complete')
    expect(response.status).toBe(501)
    expect(response.body.message).toBe(
      'Job definition creation requires an isolated host opt-in; Drive mutations are not transactional.'
    )
    expect(await readdir(dir)).toEqual(before)
    expect(await readFile(definitionPath, 'utf8')).toBe(contents)
  })
  it.each(['folderonly', 'nofile'])(
    'allows %s navigation without reading or exposing definitions',
    async (role) => {
      const readSpy = jest.spyOn(serverDrive(), 'read')
      try {
        const response = await request(listener)
          .get(`/folders/folders/${folderId}/members`)
          .set('Authorization', `Bearer ${tokens[role]}`)
          .query({ readJobDefinitionMetadata: 'true' })
        expect(response.status).toBe(200)
        expect(response.body.items).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ name: 'child', type: 'folder' }),
            expect.objectContaining({ name: 'ordinary.txt', type: 'file' })
          ])
        )
        expect(JSON.stringify(response.body)).not.toContain(definitionId)
        expect(JSON.stringify(response.body)).not.toContain(body.name)
        expect(JSON.stringify(response.body)).not.toContain('.sasjs-viya-job-')
        expect(readSpy).not.toHaveBeenCalled()
      } finally {
        readSpy.mockRestore()
      }
    }
  )
  it('ignores a local JS registry in server mode for restricted users', async () => {
    const old = process.env.LOCAL_VIYA_JS_JOBS
    process.env.LOCAL_VIYA_JS_JOBS = JSON.stringify({
      '/protected/registry-secret': '/protected/registry.js'
    })
    const readSpy = jest.spyOn(serverDrive(), 'read')
    try {
      const members = await request(listener)
        .get(`/folders/folders/${folderId}/members`)
        .set('Authorization', `Bearer ${tokens.folderonly}`)
      expect(members.status).toBe(200)
      expect(JSON.stringify(members.body)).not.toContain('registry-secret')
      expect(JSON.stringify(members.body)).not.toContain(definitionId)
      expect((await read('folderonly')).status).toBe(401)
      expect(readSpy).not.toHaveBeenCalled()
    } finally {
      readSpy.mockRestore()
      if (old === undefined) delete process.env.LOCAL_VIYA_JS_JOBS
      else process.env.LOCAL_VIYA_JS_JOBS = old
    }
  })
  it('fails closed when the file permission lookup fails', async () => {
    const original = Permission.find.bind(Permission)
    let queries = 0
    const lookup = jest
      .spyOn(Permission, 'find')
      .mockImplementation((...args: any[]) => {
        if (++queries > 2) throw new Error('permission database unavailable')
        return (original as any)(...args)
      })
    const readSpy = jest.spyOn(serverDrive(), 'read')
    try {
      const limited = await request(listener)
        .get(`/folders/folders/${folderId}/members`)
        .set('Authorization', `Bearer ${tokens.complete}`)
      expect(queries).toBeGreaterThan(2)
      expect(limited.status).toBe(200)
      expect(JSON.stringify(limited.body)).not.toContain(definitionId)
      expect(readSpy).not.toHaveBeenCalled()
    } finally {
      lookup.mockRestore()
      readSpy.mockRestore()
    }
  })
  it.each(['reader', 'fileonly'])(
    'does not allow folder members to %s without folder permission',
    async (role) => {
      const response = await request(listener)
        .get(`/folders/folders/${folderId}/members`)
        .set('Authorization', `Bearer ${tokens[role]}`)
      expect(response.status).toBe(401)
    }
  )
  it.each([
    '/folders/folders/%ID%/MEMBERS',
    '/folders/folders/%ID%/members///'
  ])('hides definitions for folder-member alias %s', async (path) => {
    const response = await request(listener)
      .get(path.replace('%ID%', folderId))
      .set('Authorization', `Bearer ${tokens.folderonly}`)
    // Dispatcher matching may reject aliases, but must never expose a definition.
    expect([200, 404]).toContain(response.status)
    expect(JSON.stringify(response.body)).not.toContain(definitionId)
    expect(JSON.stringify(response.body)).not.toContain('.sasjs-viya-job-')
  })
  it.each(['complete', 'notree', 'admin'])(
    'admits full metadata to %s',
    async (role) => {
      const response = await request(listener)
        .get(`/folders/folders/${folderId}/members`)
        .set('Authorization', `Bearer ${tokens[role]}`)
      expect(response.status).toBe(200)
      const member = response.body.items.find(
        (item: any) => item.id === definitionId
      )
      expect(member).toMatchObject({ name: body.name, type: 'child' })
      const href = member.links.find(
        (link: any) => link.rel === 'getResource'
      ).href
      const resource = await request(listener)
        .get(href)
        .set('Authorization', `Bearer ${tokens[role]}`)
      if (role === 'notree') expect(resource.status).toBe(401)
      else {
        expect(resource.status).toBe(200)
        expect(resource.body.code).toBe(body.code)
      }
    }
  )
})
