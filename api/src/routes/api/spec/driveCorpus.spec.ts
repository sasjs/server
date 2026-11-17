import './sessionEnv'
import { randomBytes } from 'crypto'
import path from 'path'
import fs from 'fs'
import { Express } from 'express'
import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'
import {
  deleteFolder,
  createFolder,
  createFile,
  generateTimestamp
} from '@sasjs/utils'
import { DEFAULT_IDENTITY, DRIVE_CORPUS } from '@sasjs/api'
import type { CorpusCase, IdentityFixture } from '@sasjs/api'
import {
  refreshAppStreamIndex,
  writeStoredAppStreamEntries
} from '../../../utils'

import * as fileUtilModules from '../../../utils/file'

const timestamp = generateTimestamp()
const tmpFolder = path.join(process.cwd(), `tmp-corpus-${timestamp}`)
jest
  .spyOn(fileUtilModules, 'getSasjsRootFolder')
  .mockImplementation(() => tmpFolder)
jest
  .spyOn(fileUtilModules, 'getUploadsFolder')
  .mockImplementation(() => path.join(tmpFolder, 'uploads'))
jest
  .spyOn(fileUtilModules, 'getFilesFolder')
  .mockImplementation(() => path.join(tmpFolder, 'drive', 'files'))
jest
  .spyOn(fileUtilModules, 'getAppStreamConfigPath')
  .mockImplementation(() =>
    path.join(tmpFolder, 'drive', 'appStreamConfig.json')
  )

import appPromise from '../../../app'
import {
  UserController,
  GroupController,
  PermissionController
} from '../../../controllers/'
import { generateAccessToken, saveTokensInDB } from '../../../utils/'
import User from '../../../model/User'
import Group from '../../../model/Group'
import Permission from '../../../model/Permission'

/**
 * The corpus is what "the same API" means: the cases @sasjs/api runs against
 * its own services, and against the browser build in sasjs/cli, run here
 * against this server's real HTTP surface. A case that answers differently is
 * this host drifting from the shared rules - the failure mode the private
 * controller implementation used to have (a rename into a blocked extension
 * answered 200, and a folder moved into itself answered 200 and then crashed
 * the move).
 *
 * One case is normalised here rather than upstream: `tree`. This server's
 * `GET /filetree` with a `_folderPath` answers ONE level, enriched with
 * `absolutePath` and `hasChildren` for the Studio browser, where the corpus
 * pins the recursive bare shape every host can answer. The enrichment is this
 * host's own surface, so the comparison here reads the shape the corpus pins
 * out of the answer.
 */
describe('drive conformance corpus', () => {
  let app: Express
  let con: Mongoose
  let mongoServer: MongoMemoryServer
  const files = path.join(tmpFolder, 'drive', 'files')

  beforeAll(async () => {
    app = await appPromise
    mongoServer = await MongoMemoryServer.create()
    con = await mongoose.connect(mongoServer.getUri())
  })

  afterAll(async () => {
    await con.connection.dropDatabase()
    await con.connection.close()
    await mongoServer.stop()
    await deleteFolder(tmpFolder)
  })

  // Translate fixture IDs to the database's IDs, and recreate every case's
  // users, memberships and rules through the host's controllers.
  const seedIdentity = async (
    fixture: IdentityFixture,
    testCase: CorpusCase
  ) => {
    await Promise.all([
      User.deleteMany({}),
      Group.deleteMany({}),
      Permission.deleteMany({})
    ])
    const ids = new Map<string, string>()
    const usernames = new Map<string, string>()
    const tokens = new Map<string, string>()
    const users = new UserController()
    const groups = new GroupController()
    const permissions = new PermissionController()

    for (const user of fixture.users) {
      const created = await users.createUser({
        username: user.username,
        displayName: user.displayName,
        password: user.password ?? randomBytes(24).toString('hex'),
        isAdmin: user.isAdmin,
        isActive: user.isActive,
        autoExec: user.autoExec
      })
      ids.set(user.uid, created.uid)
      usernames.set(user.username, created.uid)
      if (user.authProvider || user.needsToUpdatePassword)
        await User.updateOne(
          { _id: created.uid },
          {
            ...(user.authProvider ? { authProvider: user.authProvider } : {}),
            ...(user.needsToUpdatePassword
              ? { needsToUpdatePassword: true }
              : {})
          }
        )
    }

    // createUser provisions home-route grants; a corpus identity must contain
    // exactly its declared rules, not the host's automatic additions.
    await Permission.deleteMany({})

    for (const group of fixture.groups) {
      const created = await groups.createGroup({
        name: group.name,
        description: group.description,
        isActive: group.isActive
      })
      ids.set(group.uid, created.uid)
      if (group.authProvider)
        await Group.updateOne(
          { _id: created.uid },
          { authProvider: group.authProvider }
        )
      for (const username of group.users) {
        const uid = usernames.get(username)
        if (!uid) throw new Error(`Unknown fixture group member: ${username}`)
        await groups.addUserToGroup(created.uid, uid)
      }
    }

    for (const rule of fixture.permissions) {
      const principal = rule.user ?? rule.group
      const principalId =
        principal && (ids.get(principal) ?? usernames.get(principal))
      if (!principalId)
        throw new Error(`Unknown fixture principal: ${principal}`)
      await permissions.createPermission({
        path: rule.path,
        type: rule.type as any,
        setting: rule.setting as any,
        principalType: (rule.user ? 'user' : 'group') as any,
        principalId
      })
    }

    for (const token of fixture.tokens || []) {
      const userId = usernames.get(token.username)
      if (!userId)
        throw new Error(`Unknown fixture token user: ${token.username}`)
      const accessToken = generateAccessToken({
        clientId: token.clientId,
        userId
      })
      await saveTokensInDB(
        userId,
        token.clientId,
        accessToken,
        token.refreshToken || 'refresh'
      )
      if (token.accessToken) tokens.set(token.accessToken, accessToken)
    }

    if (testCase.request.token !== undefined)
      return tokens.get(testCase.request.token) ?? testCase.request.token
    const subject = testCase.request.subject
    if (!subject) return undefined
    const userId = ids.get(subject.userId)
    if (!userId) throw new Error(`Unknown fixture subject: ${subject.userId}`)
    const accessToken = generateAccessToken({
      clientId: subject.clientId,
      userId
    })
    await saveTokensInDB(userId, subject.clientId, accessToken, 'refresh')
    return accessToken
  }

  // The case's seed, written through the host's own filesystem: the server's
  // drive IS a real folder tree, so a case starts from the files it names. A
  // binary seed is written with fs itself - a text helper would re-encode
  // bytes above 0x7f on their way through a UTF-8 string.
  const seedDrive = async (testCase: CorpusCase) => {
    await deleteFolder(files)

    // The app the unpublish cases remove, exactly as the package's own runner
    // seeds it: the id is stated rather than minted, because a case that pins
    // "the id that is there" cannot invent one.
    await writeStoredAppStreamEntries([
      {
        id: '6f1c1c1e-6a1e-4c4a-9d1a-1b2c3d4e5f60',
        name: 'myApp',
        appLoc: '/Public/myApp',
        streamWebFolder: 'web',
        publishedAt: '2026-01-01T00:00:00.000Z'
      }
    ])
    await refreshAppStreamIndex()

    for (const [file, contents] of Object.entries(testCase.seed || {})) {
      const target = path.join(files, file)
      await createFolder(path.dirname(target))
      if (typeof contents === 'string') await createFile(target, contents)
      else
        await fs.promises.writeFile(target, Buffer.from(contents as Uint8Array))
    }
  }

  const queryOf = (testCase: CorpusCase) => {
    const query = new URLSearchParams()
    for (const [key, value] of Object.entries(testCase.request.query || {})) {
      if (value !== undefined) query.set(key, String(value))
    }
    const suffix = query.toString() ? `?${query}` : ''
    return testCase.route.split(' ')[1] + suffix
  }

  // The read route serves from an allowlist: an x.html or x.svg drive file
  // must not arrive as a type a browser executes - caller-supplied bytes on
  // the API origin with an executable type is the stored-XSS shape.
  it('serves an html drive file as a download, never text/html', async () => {
    const accessToken = await seedIdentity(DEFAULT_IDENTITY, {
      id: 'html-download',
      route: 'GET /SASjsApi/drive/file',
      description: 'html download',
      request: { subject: { userId: 'user-admin', clientId: 'web_app' } },
      expect: { status: 200 }
    })
    await deleteFolder(files)
    await createFolder(files)
    await createFile(
      path.join(files, 'x.html'),
      '<script>window.alert(1)</script>'
    )

    const res = await request(app)
      .get('/SASjsApi/drive/file?_filePath=' + encodeURIComponent('/x.html'))
      .auth(accessToken as string, { type: 'bearer' })

    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toContain('application/octet-stream')
    expect(res.headers['x-content-type-options']).toBe('nosniff')
  })

  describe('denied valid mutations preserve persisted drive state', () => {
    const publishedId = '6f1c1c1e-6a1e-4c4a-9d1a-1b2c3d4e5f60'
    const deploy = {
      appLoc: '/Public/myApp',
      fileTree: {
        members: [{ name: 'new.txt', type: 'file', code: 'bmV3IGNvbnRlbnRz' }]
      }
    }
    const mutations = [
      {
        name: 'upload a new file',
        send: (token: string) =>
          request(app)
            .post('/SASjsApi/drive/file')
            .auth(token, { type: 'bearer' })
            .field('filePath', '/data/new.csv')
            .attach('file', Buffer.from('new data'), 'new.csv')
      },
      {
        name: 'update a file',
        send: (token: string) =>
          request(app)
            .patch('/SASjsApi/drive/file')
            .auth(token, { type: 'bearer' })
            .field('filePath', '/data/old.csv')
            .attach('file', Buffer.from('replacement'), 'old.csv')
      },
      {
        name: 'delete a file',
        send: (token: string) =>
          request(app)
            .delete('/SASjsApi/drive/file')
            .auth(token, { type: 'bearer' })
            .query({ _filePath: '/data/old.csv' })
      },
      {
        name: 'rename a file',
        send: (token: string) =>
          request(app)
            .post('/SASjsApi/drive/rename')
            .auth(token, { type: 'bearer' })
            .send({ oldPath: '/data/old.csv', newPath: '/data/renamed.csv' })
      },
      {
        name: 'create a folder',
        send: (token: string) =>
          request(app)
            .post('/SASjsApi/drive/folder')
            .auth(token, { type: 'bearer' })
            .send({ folderPath: '/data/new-folder' })
      },
      {
        name: 'delete a nonempty folder',
        send: (token: string) =>
          request(app)
            .delete('/SASjsApi/drive/folder')
            .auth(token, { type: 'bearer' })
            .query({ _folderPath: '/data/nested' })
      },
      {
        name: 'deploy a tree',
        send: (token: string) =>
          request(app)
            .post('/SASjsApi/drive/deploy')
            .auth(token, { type: 'bearer' })
            .send(deploy)
      },
      {
        name: 'upload a deploy document',
        send: (token: string) =>
          request(app)
            .post('/SASjsApi/drive/deploy/upload')
            .auth(token, { type: 'bearer' })
            .attach('file', Buffer.from(JSON.stringify(deploy)), 'deploy.json')
      },
      {
        name: 'unpublish an app',
        send: (token: string) =>
          request(app)
            .delete('/SASjsApi/drive/deploy')
            .auth(token, { type: 'bearer' })
            .send({ id: publishedId })
      }
    ]

    // Record paths, directories and exact bytes, including the publication
    // registry beside files. This catches deletion, replacement and new files.
    const snapshot = async (root: string): Promise<Record<string, string>> => {
      const result: Record<string, string> = {}
      const visit = async (dir: string, relative: string) => {
        for (const entry of await fs.promises.readdir(dir, {
          withFileTypes: true
        })) {
          const name = path.join(relative, entry.name)
          const absolute = path.join(dir, entry.name)
          if (entry.isDirectory()) {
            result[name + '/'] = 'directory'
            await visit(absolute, name)
          } else {
            result[name] = (await fs.promises.readFile(absolute)).toString(
              'base64'
            )
          }
        }
      }
      await visit(root, '')
      return result
    }

    it.each(mutations)('$name', async ({ send }) => {
      const testCase: CorpusCase = {
        id: 'denied-mutation',
        route: 'POST /SASjsApi/drive/file',
        description: 'valid mutation by an ungranted user',
        request: {
          subject: { userId: 'user-restricted', clientId: 'web_app' }
        },
        seed: {
          '/data/old.csv': 'original data',
          '/data/nested/keep.csv': 'nested data',
          '/Public/myApp/old.txt': 'deployed data'
        },
        expect: { status: 401 }
      }
      // Remove the default file grant too: permissions apply to a route, not
      // a particular HTTP method, and file mutations must be denied as well.
      const identity = {
        ...DEFAULT_IDENTITY,
        permissions: DEFAULT_IDENTITY.permissions.filter(
          (rule) => rule.path !== '/SASjsApi/drive/file'
        )
      }
      const deniedToken = await seedIdentity(identity, testCase)
      const admin = await User.findOne({ username: 'sasjsadmin' })
      if (!admin) throw new Error('Missing admin fixture')
      const adminToken = generateAccessToken({
        clientId: 'web_app',
        userId: String(admin._id)
      })
      await saveTokensInDB(String(admin._id), 'web_app', adminToken, 'refresh')
      await seedDrive(testCase)
      const driveRoot = path.join(tmpFolder, 'drive')
      const before = await snapshot(driveRoot)

      const denied = await send(deniedToken as string)
      expect(await snapshot(driveRoot)).toEqual(before)
      expect(denied.statusCode).toBe(401)

      // Same payload, same seeded state, authorized caller: proves the request
      // would really have changed persisted state rather than failing validation.
      const allowed = await send(adminToken)
      expect(allowed.statusCode).toBe(200)
      expect(await snapshot(driveRoot)).not.toEqual(before)
    })
  })

  // A case that needs a failing store cannot be replayed over HTTP: this host's
  // drive is node's fs, and a request has no way to make it refuse a write. The
  // package's own suite pins the `500` body; here the case is left out rather
  // than turned into a test of the filesystem.
  const replayable = DRIVE_CORPUS.filter((testCase) => !testCase.unwritable)

  it.each(replayable)('$id', async (testCase) => {
    const want = testCase.expect
    const accessToken = await seedIdentity(
      testCase.identity || DEFAULT_IDENTITY,
      testCase
    )
    await seedDrive(testCase)
    const requestPath = queryOf(testCase)
    const method = testCase.route.split(' ')[0].toLowerCase()
    const authenticate = (call: any) =>
      accessToken === undefined
        ? call
        : call.auth(accessToken, { type: 'bearer' })

    let res: any
    if (testCase.request.file) {
      // a form upload: the file, plus the destination when the case sends it
      // as the filePath field rather than the query
      const file = testCase.request.file
      const bytes = Buffer.from(file.contents as string | Uint8Array)
      let call = (request(app) as any)
        [method](requestPath)
        .attach('file', bytes, file.name)
      const formPath = testCase.request.body?.filePath
      if (formPath !== undefined)
        call = call.field('filePath', String(formPath))
      res = await authenticate(call)
    } else if (testCase.request.body) {
      res = await authenticate(
        (request(app) as any)[method](requestPath).send(testCase.request.body)
      )
    } else if (
      want.contents !== undefined &&
      typeof want.contents !== 'string'
    ) {
      // a binary read: superagent parses JSON by default and leaves {} for an
      // octet-stream, so the raw bytes need a collector
      const binaryParser = (res: any, fn: (err: any, body: any) => void) => {
        const chunks: Buffer[] = []
        res.on('data', (chunk: Buffer) => chunks.push(chunk))
        res.on('end', () => fn(null, Buffer.concat(chunks)))
      }
      res = await authenticate(
        (request(app) as any)
          [method](requestPath)
          .buffer(true)
          .parse(binaryParser)
      )
    } else {
      res = await authenticate((request(app) as any)[method](requestPath))
    }

    expect(res.statusCode).toBe(want.status)

    for (const file of testCase.expectDrive?.present || [])
      expect(fs.existsSync(path.join(files, file))).toBe(true)
    for (const file of testCase.expectDrive?.missing || [])
      expect(fs.existsSync(path.join(files, file))).toBe(false)

    if (want.error !== undefined) {
      // The drive's file routes answer the message as text; the deploy routes
      // answer an envelope, so there the message travels in the body and the
      // body assertion below compares the rest of it.
      if (want.body !== undefined)
        expect((res.body as any)?.message).toBe(want.error)
      else expect(res.text).toBe(want.error)
    }

    const wantContents = want.contents
    if (typeof wantContents === 'string') {
      expect(res.text).toBe(wantContents)
      // The type is derived from the extension, the way sendFile did before
      // the delegation: text/html is the stored-XSS shape and never a valid
      // answer for a drive read
      const contentType = res.headers['content-type'] || ''
      expect(contentType).not.toContain('text/html')
      if (testCase.id === 'read-file') expect(contentType).toContain('text/csv')
    } else if (wantContents !== undefined) {
      // a binary body arrives on res.body as a Buffer when no parser claims
      // the content-type; superagent 10 leaves {} for application/octet-stream
      // unless the request buffers it
      const received = Buffer.from(
        (res.body as Buffer) ?? Buffer.from(res.text ?? '', 'binary')
      )
      const expected = wantContents as Uint8Array
      expect(received.length).toBe(expected.length)
      for (let i = 0; i < expected.length; i++)
        expect(received[i]).toBe(expected[i])
      // the seeded bytes (80, 75, 3, 4) are valid UTF-8, so the store serves
      // them as text under the .zip name and the type follows the extension -
      // the same answer sendFile gave. What the case pins is the BYTES
      if (testCase.id === 'bytes-round-trip')
        expect(res.headers['content-type'] || '').not.toContain('text/html')
    }

    if (want.body !== undefined) {
      if (testCase.id === 'tree') {
        // this host's one-level answer carries the Studio enrichment
        // (absolutePath, hasChildren); the corpus pins the bare shape every
        // host can answer, so the comparison reads the pinned fields
        const strip = (node: any): any => ({
          name: node.name,
          relativePath: node.relativePath,
          isFolder: node.isFolder,
          children: (node.children || []).map(strip)
        })
        expect(strip(res.body.tree)).toEqual((want.body as any).tree)
      } else {
        expect(res.body).toEqual(want.body)
      }
    }
  })
})
