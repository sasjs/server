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
import { DRIVE_CORPUS } from '@sasjs/api'
import type { CorpusCase } from '@sasjs/api'

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

import appPromise from '../../../app'
import {
  UserController,
  PermissionController,
  PermissionType,
  PermissionSettingForRoute,
  PrincipalType
} from '../../../controllers/'
import { generateAccessToken, saveTokensInDB } from '../../../utils/'

const clientId = 'someclientID'
const user = {
  displayName: 'Test User',
  username: 'testUsername',
  password: '87654321',
  isAdmin: false,
  isActive: true
}

const permission = {
  type: PermissionType.route,
  principalType: PrincipalType.user,
  setting: PermissionSettingForRoute.grant
}

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
  const userController = new UserController()
  const permissionController = new PermissionController()
  const files = path.join(tmpFolder, 'drive', 'files')
  let accessToken: string

  beforeAll(async () => {
    app = await appPromise
    mongoServer = await MongoMemoryServer.create()
    con = await mongoose.connect(mongoServer.getUri())

    const dbUser = await userController.createUser(user)
    const token = await generateAccessToken({ clientId, userId: dbUser.uid })
    await saveTokensInDB(dbUser.uid, clientId, token, 'arefresh')
    accessToken = token

    // every route the corpus touches, granted to the test user
    for (const route of [
      '/SASjsApi/drive/file',
      '/SASjsApi/drive/folder',
      '/SASjsApi/drive/rename',
      '/SASjsApi/drive/fileTree',
      '/SASjsApi/drive/deploy'
    ]) {
      await permissionController.createPermission({
        ...permission,
        path: route,
        principalId: dbUser.uid
      })
    }
  })

  afterAll(async () => {
    await con.connection.dropDatabase()
    await con.connection.close()
    await mongoServer.stop()
    await deleteFolder(tmpFolder)
  })

  // The case's seed, written through the host's own filesystem: the server's
  // drive IS a real folder tree, so a case starts from the files it names. A
  // binary seed is written with fs itself - a text helper would re-encode
  // bytes above 0x7f on their way through a UTF-8 string.
  const seedDrive = async (testCase: CorpusCase) => {
    await deleteFolder(files)
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
    await deleteFolder(files)
    await createFolder(files)
    await createFile(
      path.join(files, 'x.html'),
      '<script>window.alert(1)</script>'
    )

    const res = await request(app)
      .get('/SASjsApi/drive/file?_filePath=' + encodeURIComponent('/x.html'))
      .auth(accessToken, { type: 'bearer' })

    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toContain('application/octet-stream')
    expect(res.headers['x-content-type-options']).toBe('nosniff')
  })

  // A case that needs a failing store cannot be replayed over HTTP: this host's
  // drive is node's fs, and a request has no way to make it refuse a write. The
  // package's own suite pins the `500` body; here the case is left out rather
  // than turned into a test of the filesystem.
  const replayable = DRIVE_CORPUS.filter((testCase) => !testCase.unwritable)

  it.each(replayable)('$id', async (testCase) => {
    const want = testCase.expect
    await seedDrive(testCase)
    const requestPath = queryOf(testCase)
    const method = testCase.route.split(' ')[0].toLowerCase()

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
      res = await call.auth(accessToken, { type: 'bearer' })
    } else if (testCase.request.body) {
      res = await (request(app) as any)
        [method](requestPath)
        .send(testCase.request.body)
        .auth(accessToken, { type: 'bearer' })
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
      res = await (request(app) as any)
        [method](requestPath)
        .buffer(true)
        .parse(binaryParser)
        .auth(accessToken, { type: 'bearer' })
    } else {
      res = await (request(app) as any)
        [method](requestPath)
        .auth(accessToken, { type: 'bearer' })
    }

    expect(res.statusCode).toBe(want.status)

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
