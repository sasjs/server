import path from 'path'
import fs from 'fs'
import AdmZip from 'adm-zip'
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
import { DEPLOY_CORPUS } from '@sasjs/api'
import type { CorpusCase } from '@sasjs/api'

import * as fileUtilModules from '../../../utils/file'

const timestamp = generateTimestamp()
const tmpFolder = path.join(process.cwd(), `tmp-deploy-corpus-${timestamp}`)
jest
  .spyOn(fileUtilModules, 'getSasjsRootFolder')
  .mockImplementation(() => tmpFolder)
jest
  .spyOn(fileUtilModules, 'getUploadsFolder')
  .mockImplementation(() => path.join(tmpFolder, 'uploads'))
jest
  .spyOn(fileUtilModules, 'getFilesFolder')
  .mockImplementation(() => path.join(tmpFolder, 'drive', 'files'))
// the index: unmocked, a publish writes into the repo's own sasjs_root and the
// apps leak between cases, between spec files and between runs
jest
  .spyOn(fileUtilModules, 'getAppStreamConfigPath')
  .mockImplementation(() => path.join(tmpFolder, 'appStreamConfig.json'))

import appPromise from '../../../app'
import {
  UserController,
  PermissionController,
  PermissionType,
  PermissionSettingForRoute,
  PrincipalType
} from '../../../controllers/'
import { generateAccessToken, saveTokensInDB } from '../../../utils/'
import {
  refreshAppStreamIndex,
  writeStoredAppStreamEntries
} from '../../../utils/appStreamConfig'

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
 * The deploy half of the corpus, run against this server's real HTTP surface.
 *
 * The upload route is where the two hosts differed most: the document says the
 * folder and the stream travel in the QUERY because the body is an archive, and
 * `sasjs deploy` sends an archive - so a case that states them in the body can
 * only pass against a host that expands the archive before it looks. Here the
 * archive is made from the tree the case states, exactly as a client would send
 * one, and the server expands it itself.
 *
 * One group is left out, for a reason this host cannot change: the `unwritable`
 * cases, because this drive is node's fs and a request has no way to make it refuse
 * a write. The package's own suite pins that `500` body.
 *
 * The removal cases run: they start from an index this spec seeds with the app the
 * case names, which is what the route reads.
 */
describe('deploy conformance corpus', () => {
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

    for (const route of [
      '/SASjsApi/drive/deploy',
      '/SASjsApi/drive/deploy/upload'
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

  /** The tree the case states, as the archive a client uploads. */
  const archiveOf = (tree: any): Buffer => {
    const zip = new AdmZip()

    const walk = (members: any[], prefix: string) => {
      for (const member of members || []) {
        const at = prefix ? `${prefix}/${member.name}` : member.name
        if (member.type === 'folder') walk(member.members, at)
        else
          zip.addFile(
            at,
            member.encoding === 'base64'
              ? Buffer.from(String(member.code), 'base64')
              : Buffer.from(String(member.code ?? ''))
          )
      }
    }

    walk(tree?.members, '')

    return zip.toBuffer()
  }

  /**
   * The index a removal case starts from: the app the case names, so a case that
   * removes it finds it and one naming another id does not. Written through the
   * host's own store, which is what the route reads.
   */
  const seedIndex = async (testCase: CorpusCase) => {
    const id = (testCase.request.body as any)?.id
    const named = (testCase.expect.partial as any)?.app

    const entries =
      testCase.route === 'DELETE /SASjsApi/drive/deploy' &&
      id !== undefined &&
      named?.id === id
        ? [
            {
              id,
              name: named.name ?? 'myApp',
              appLoc: '/Public/myApp',
              streamWebFolder: 'web',
              publishedAt: '2026-01-01T00:00:00.000Z'
            }
          ]
        : []

    await writeStoredAppStreamEntries(entries)
    await refreshAppStreamIndex()
  }

  /** The case's seed, written through the host's own filesystem. */
  const seedDrive = async (testCase: CorpusCase) => {
    await deleteFolder(files)
    await createFolder(files)
    await seedIndex(testCase)
    for (const [file, contents] of Object.entries(testCase.seed || {})) {
      const target = path.join(files, file)
      await createFolder(path.dirname(target))
      if (typeof contents === 'string') await createFile(target, contents)
      else
        await fs.promises.writeFile(target, Buffer.from(contents as Uint8Array))
    }
  }

  /**
   * The fields the case states, as the query the document puts them in.
   *
   * A deploy case states the folder and the stream in the request body while
   * `@sasjs/api` 0.27.1 is the version installed; the document states them in the
   * query on the upload route, because the archive is the body, and the server
   * reads them there. The harness sends them where the document says, which is
   * also where sasjs/api#72 moves the cases.
   */
  const queryOf = (testCase: CorpusCase) => {
    const body = (testCase.request.body || {}) as any
    const query = new URLSearchParams()
    // the body's fields are the query's only on the upload route, where the
    // document puts them; on the JSON route they stay in the body, or a regression
    // that made that route read the query would leave every case green
    const stated: Record<string, unknown> = testCase.route.endsWith(
      '/deploy/upload'
    )
      ? { ...body, ...testCase.request.query }
      : { ...(testCase.request.query || {}) }
    delete stated.fileTree
    for (const [key, value] of Object.entries(stated)) {
      if (value !== undefined) query.set(key, String(value))
    }
    const suffix = query.toString() ? `?${query}` : ''
    return testCase.route.split(' ')[1] + suffix
  }

  const replayable = DEPLOY_CORPUS.filter(
    (testCase) =>
      !testCase.unwritable &&
      // a tree that is not a tree is an expansion no archive can produce, which the
      // corpus marks on the case rather than leaving each host to name it
      testCase.transport !== 'expansion'
  )

  it.each(replayable)('$id', async (testCase) => {
    const want = testCase.expect
    await seedDrive(testCase)
    const requestPath = queryOf(testCase)
    const body = (testCase.request.body || {}) as any
    const method = testCase.route.split(' ')[0].toLowerCase()

    const res = await (requestPath.includes('/deploy/upload')
      ? (() => {
          const call = request(app)
            .post(requestPath)
            .attach('file', archiveOf(body.fileTree), 'deploy.zip')

          // a host that receives an archive takes the fields beside it as form
          // fields; the document puts them in the query, which `requestPath` carries
          for (const [field, value] of Object.entries(body))
            if (field !== 'fileTree' && value !== undefined)
              call.field(field, String(value))

          return call.auth(accessToken, { type: 'bearer' })
        })()
      : (request(app) as any)
          [method](requestPath)
          .send(body)
          .auth(accessToken, { type: 'bearer' }))

    expect(res.statusCode).toBe(want.status)

    if (want.error !== undefined) {
      // the deploy route answers a refusal as an envelope; the removal answers the
      // message itself, which is what the corpus states for it
      const message = (res.body as any)?.message ?? res.text
      expect(message).toBe(want.error)
    }

    if (want.body !== undefined) expect(res.body).toEqual(want.body)

    if (want.partial !== undefined) expect(res.body).toMatchObject(want.partial)

    // the state a case leaves, since both deploy answers are 200
    for (const file of testCase.expectDrive?.present || [])
      expect({
        file,
        present: fs.existsSync(path.join(files, file))
      }).toEqual({ file, present: true })

    for (const file of testCase.expectDrive?.missing || [])
      expect({
        file,
        present: fs.existsSync(path.join(files, file))
      }).toEqual({ file, present: false })
  })

  it('states an app only on the answer of the deploy that published one', async () => {
    const web = {
      members: [
        {
          name: 'services',
          type: 'folder',
          members: [
            {
              name: 'web',
              type: 'folder',
              members: [
                { name: 'index.html', type: 'file', code: '<h1>App</h1>' }
              ]
            }
          ]
        }
      ]
    }

    const published = await request(app)
      .post('/SASjsApi/drive/deploy')
      .send({
        appLoc: '/Public/apps/published',
        streamWebFolder: 'web',
        fileTree: web
      })
      .auth(accessToken, { type: 'bearer' })

    expect(published.statusCode).toBe(200)
    expect((published.body as any).app).toMatchObject({ name: 'published' })

    // a deploy that publishes nothing. A shared response object still carries the app
    // above, and `sasjs deploy` would print a URL that is not this deploy's
    const plain = await request(app)
      .post('/SASjsApi/drive/deploy')
      .send({
        appLoc: '/Public/apps/plain',
        fileTree: { members: [{ name: 'a.txt', type: 'file', code: 'a' }] }
      })
      .auth(accessToken, { type: 'bearer' })

    expect(plain.statusCode).toBe(200)
    expect(plain.body).not.toHaveProperty('app')
  })

  it('publishes what an archive carries at the folder the query names', async () => {
    // the shape a client sends: the fields in the query, the archive as the body
    const tree = {
      members: [
        {
          name: 'services',
          type: 'folder',
          members: [
            {
              name: 'web',
              type: 'folder',
              members: [
                { name: 'index.html', type: 'file', code: '<h1>Uploaded</h1>' }
              ]
            }
          ]
        }
      ]
    }

    const res = await request(app)
      .post(
        '/SASjsApi/drive/deploy/upload?appLoc=' +
          encodeURIComponent('/Public/apps/uploaded-by-query') +
          '&streamWebFolder=web'
      )
      .attach('file', archiveOf(tree), 'deploy.zip')
      .auth(accessToken, { type: 'bearer' })

    expect(res.statusCode).toBe(200)
    expect((res.body as any).app).toMatchObject({
      name: 'uploaded-by-query'
    })
    expect(
      fs.readFileSync(
        path.join(
          files,
          '/Public/apps/uploaded-by-query/services/web/index.html'
        ),
        'utf8'
      )
    ).toBe('<h1>Uploaded</h1>')
  })
})
