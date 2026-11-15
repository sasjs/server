import path from 'path'
import { Express } from 'express'
import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'
import AdmZip from 'adm-zip'

import { existsSync, readdirSync } from 'fs'

import { deleteFolder, fileExists, readFile } from '@sasjs/utils'
import * as fileUtilModules from '../../../utils/file'

const tmpFolder = path.join(process.cwd(), `tmp-app-package-${process.pid}`)

jest
  .spyOn(fileUtilModules, 'getFilesFolder')
  .mockImplementation(() => path.join(tmpFolder, 'drive', 'files'))
jest
  .spyOn(fileUtilModules, 'getAppStreamConfigPath')
  .mockImplementation(() => path.join(tmpFolder, 'appStreamConfig.json'))

import appPromise from '../../../app'
import {
  PermissionController,
  PermissionSettingForRoute,
  PermissionType,
  PrincipalType,
  UserController
} from '../../../controllers/'
import {
  generateAccessToken,
  readStoredAppStreamEntries,
  refreshAppStreamIndex,
  saveTokensInDB
} from '../../../utils/'

const { getFilesFolder } = fileUtilModules

const user = {
  displayName: 'Package User',
  username: 'packageUsername',
  password: '87654321',
  isAdmin: false,
  isActive: true
}

const clientId = 'someclientID'

const file = (name: string, code = '') => ({ name, type: 'file', code })
const folder = (name: string, members: any[]) => ({
  name,
  type: 'folder',
  members
})

/** The bundle a current `sasjs build` writes: a manifest, a frontend, a backend. */
const packageTree = (
  name: string,
  options: { appLoc?: string; backend?: any[]; frontend?: any[] } = {}
) => ({
  members: [
    {
      name: 'sasjs.app.json',
      type: 'file',
      code: JSON.stringify({
        name,
        ...(options.appLoc === undefined ? {} : { appLoc: options.appLoc })
      })
    },
    folder(
      'web',
      options.frontend ?? [
        file('index.html', `<h1>${name}</h1>`),
        file('app.js')
      ]
    ),
    ...(options.backend === undefined
      ? []
      : [folder('backend', options.backend)])
  ]
})

const onDisk = (...segments: string[]) =>
  path.join(getFilesFolder(), ...segments)

/**
 * What `apps/` holds, for a case that asserts nothing was written.
 *
 * A missing folder answers `[]`, because that is what a server that has published
 * nothing has. Anything else - a permission error, a drive that is not mounted -
 * propagates: answering `[]` there would make a failed read look like a deploy that
 * wrote nothing, which is the assertion these cases exist to make.
 */
const frontends = (): string[] => {
  const folder = onDisk('apps')

  if (!existsSync(folder)) return []

  return readdirSync(folder).sort()
}

describe('a deploy of a package', () => {
  let app: Express
  let con: Mongoose
  let mongoServer: MongoMemoryServer
  let accessToken: string

  const controller = new UserController()
  const permissionController = new PermissionController()

  beforeAll(async () => {
    app = await appPromise

    mongoServer = await MongoMemoryServer.create()
    con = await mongoose.connect(mongoServer.getUri())

    const created = await controller.createUser(user)
    const dbUser = await controller.getUserByUsername(
      { user: { isAdmin: false } } as any,
      created.username
    )
    accessToken = generateAccessToken({ clientId, userId: dbUser.uid })
    await saveTokensInDB(dbUser.uid, clientId, accessToken, 'refreshToken')

    for (const route of [
      '/SASjsApi/drive/deploy',
      '/SASjsApi/drive/deploy/upload',
      // every app's own path is gated on the stream it lives under, so a caller
      // that may publish also has to be able to open what it published
      '/AppStream'
    ])
      await permissionController.createPermission({
        type: PermissionType.route,
        principalType: PrincipalType.user,
        setting: PermissionSettingForRoute.grant,
        path: route,
        principalId: dbUser.uid
      })

    await refreshAppStreamIndex()
  })

  afterAll(async () => {
    await con.connection.dropDatabase()
    await con.connection.close()
    await mongoServer.stop()
    await deleteFolder(tmpFolder)
  })

  const deploy = (body: any) =>
    request(app)
      .post('/SASjsApi/drive/deploy')
      .auth(accessToken, { type: 'bearer' })
      .send(body)

  const upload = (zip: AdmZip, query = '') =>
    request(app)
      .post(`/SASjsApi/drive/deploy/upload${query}`)
      .auth(accessToken, { type: 'bearer' })
      .attach('file', zip.toBuffer(), 'bundle.zip')

  const zipOf = (tree: any) => {
    const zip = new AdmZip()

    const walk = (members: any[], prefix = '') => {
      for (const member of members) {
        const at = prefix ? `${prefix}/${member.name}` : member.name

        if (member.type === 'folder') walk(member.members, at)
        else zip.addFile(at, Buffer.from(member.code ?? '', 'utf8'))
      }
    }

    walk(tree.members)

    return zip
  }

  it('writes the frontend to apps/<name> and the backend to appLoc', async () => {
    const res = await deploy({
      fileTree: packageTree('macrodash', {
        appLoc: '/Public/app/md',
        backend: [
          folder('services', [
            folder('common', [file('getscores', '%put hi;')])
          ])
        ]
      })
    }).expect(200)

    expect(res.body.app.name).toBe('macrodash')
    expect(res.body.app.url).toMatch(/^\/app\/[0-9a-f-]{36}\/$/)

    // the frontend is the CONTENTS of web/, so it lands at the app's root
    expect(await fileExists(onDisk('apps', 'macrodash', 'index.html'))).toBe(
      true
    )
    expect(await readFile(onDisk('apps', 'macrodash', 'index.html'))).toBe(
      '<h1>macrodash</h1>'
    )

    // the manifest is metadata, so it is not served as an app's file
    expect(
      await fileExists(onDisk('apps', 'macrodash', 'sasjs.app.json'))
    ).toBe(false)

    // the backend is the CONTENTS of backend/, written to appLoc
    expect(
      await fileExists(
        onDisk('Public', 'app', 'md', 'services', 'common', 'getscores')
      )
    ).toBe(true)

    const [entry] = await readStoredAppStreamEntries()

    expect(entry).toMatchObject({
      name: 'macrodash',
      appLoc: '/Public/app/md'
    })
    expect(entry.streamWebFolder).toBeUndefined()
  })

  it('serves the published frontend from its own URL', async () => {
    const [entry] = (await readStoredAppStreamEntries()).filter(
      (candidate) => candidate.name === 'macrodash'
    )

    const page = await request(app)
      .get(`/app/${entry.id}/`)
      .auth(accessToken, { type: 'bearer' })
      .expect(200)

    expect(page.text).toBe('<h1>macrodash</h1>')
  })

  it('publishes a zip that carries the two halves', async () => {
    const zip = zipOf(
      packageTree('zipped', {
        appLoc: '/Public/app/zipped',
        backend: [folder('services', [file('run', '%put zip;')])]
      })
    )

    const res = await upload(zip).expect(200)

    expect(res.body.app.name).toBe('zipped')
    expect(await fileExists(onDisk('apps', 'zipped', 'index.html'))).toBe(true)
    expect(
      await fileExists(onDisk('Public', 'app', 'zipped', 'services', 'run'))
    ).toBe(true)
  })

  it('replaces the folder a backend lands in, so a service it dropped stops being served', async () => {
    const withTwo = zipOf(
      packageTree('replaces', {
        appLoc: '/Public/app/replaces',
        backend: [folder('services', [file('run', ''), file('dropped', '')])]
      })
    )

    await upload(withTwo).expect(200)

    expect(
      await fileExists(
        onDisk('Public', 'app', 'replaces', 'services', 'dropped')
      )
    ).toBe(true)

    // the same bundle, one service lighter: the folder becomes what it carries,
    // rather than keeping a file nothing serves any more
    const withOne = zipOf(
      packageTree('replaces', {
        appLoc: '/Public/app/replaces',
        backend: [folder('services', [file('run', '')])]
      })
    )

    await upload(withOne).expect(200)

    expect(
      await fileExists(onDisk('Public', 'app', 'replaces', 'services', 'run'))
    ).toBe(true)
    expect(
      await fileExists(
        onDisk('Public', 'app', 'replaces', 'services', 'dropped')
      )
    ).toBe(false)
  })

  it('deploys a bundle that carries only a backend, and publishes no app', async () => {
    const before = frontends()

    const zip = zipOf({
      members: [
        {
          name: 'sasjs.app.json',
          type: 'file',
          code: JSON.stringify({ appLoc: '/Public/app/backendonly' })
        },
        folder('backend', [folder('services', [file('only', '')])])
      ]
    })

    const res = await upload(zip).expect(200)

    // nothing to serve means nothing to index
    expect(res.body.app).toBeUndefined()
    expect(
      await fileExists(
        onDisk('Public', 'app', 'backendonly', 'services', 'only')
      )
    ).toBe(true)
    expect(frontends()).toEqual(before)
  })

  it('takes the folder of a backend-only bundle from the query when no manifest names one', async () => {
    const zip = zipOf({
      members: [folder('backend', [folder('services', [file('named', '')])])]
    })

    const res = await upload(zip, '?appLoc=%2FPublic%2Fapp%2Fqueryloc').expect(
      200
    )

    expect(res.body.app).toBeUndefined()
    expect(
      await fileExists(onDisk('Public', 'app', 'queryloc', 'services', 'named'))
    ).toBe(true)
  })

  it('refuses a backend that names no folder for it', async () => {
    const zip = zipOf({
      members: [folder('backend', [folder('services', [file('run', '')])])]
    })

    const res = await upload(zip).expect(400)

    expect(String(res.body.message ?? res.body)).toContain('appLoc')
  })

  it('publishes a bare zip of a built web folder, named by the query', async () => {
    const zip = new AdmZip()
    zip.addFile('index.html', Buffer.from('<h1>bare</h1>', 'utf8'))
    zip.addFile('main.js', Buffer.from('console.log(1)', 'utf8'))

    const res = await upload(zip, '?name=bare').expect(200)

    expect(res.body.app.name).toBe('bare')
    expect(await fileExists(onDisk('apps', 'bare', 'index.html'))).toBe(true)
  })

  it('replaces a shared backend: the last bundle to carry it is what the folder holds', async () => {
    await deploy({
      fileTree: packageTree('left', {
        appLoc: '/Public/app/shared',
        backend: [folder('services', [file('left-service', 'left')])]
      })
    }).expect(200)

    await deploy({
      fileTree: packageTree('right', {
        appLoc: '/Public/app/shared',
        backend: [folder('services', [file('right-service', 'right')])]
      })
    }).expect(200)

    // each deploy replaces the folder it lands in, so the folder becomes what the
    // last bundle carries - a service it dropped stops being served, rather than
    // staying reachable with nothing naming it
    expect(
      await fileExists(
        onDisk('Public', 'app', 'shared', 'services', 'left-service')
      )
    ).toBe(false)
    expect(
      await fileExists(
        onDisk('Public', 'app', 'shared', 'services', 'right-service')
      )
    ).toBe(true)

    // both apps stay published: an app is its frontend, and the folder is shared
    const entries = await readStoredAppStreamEntries()

    expect(
      entries.filter((entry) => entry.appLoc === '/Public/app/shared')
    ).toHaveLength(2)
  })

  it('removes only the frontend when the app is deleted', async () => {
    const [entry] = (await readStoredAppStreamEntries()).filter(
      (candidate) => candidate.name === 'right'
    )

    // the surface is behind the CSRF middleware, so a write carries the cookie the
    // landing page hands out
    const agent = request.agent(app)
    const landing = await agent
      .get('/app/')
      .auth(accessToken, { type: 'bearer' })
      .expect(200)
    const cookie = ([] as string[])
      .concat(landing.headers['set-cookie'] ?? [])
      .map((line: string) => line.split(';')[0])
      .find((pair: string) => pair.startsWith('XSRF-TOKEN=')) as string

    await agent
      .delete(`/app/${entry.id}`)
      .set('X-XSRF-TOKEN', decodeURIComponent(cookie.split('=')[1]))
      .auth(accessToken, { type: 'bearer' })
      .expect(200)

    expect(await fileExists(onDisk('apps', 'right'))).toBe(false)

    // the backend survives: it is a folder an app names, not a folder an app owns,
    // and the app that is still published reads the same one
    expect(
      await fileExists(
        onDisk('Public', 'app', 'shared', 'services', 'right-service')
      )
    ).toBe(true)

    const entries = await readStoredAppStreamEntries()

    expect(
      entries.find((candidate) => candidate.name === 'right')
    ).toBeUndefined()
  })

  it('refuses a package with no name, and writes nothing', async () => {
    // what the drive holds before, and not a path guessed from the fixture: a
    // folder named after a page's CONTENTS would never be written, so asserting
    // its absence proved nothing
    const before = frontends()
    const entry = await deploy({
      fileTree: {
        members: [folder('web', [file('index.html', '<h1>anon</h1>')])]
      }
    })

    expect(entry.status).toBe(400)
    expect(entry.body.message).toMatch(/"name" is required/)
    expect(frontends()).toEqual(before)
  })

  it('removes the frontend through the deploy route too, so both removals agree', async () => {
    await deploy({
      fileTree: packageTree('both-ways', { appLoc: '/Public/app/both' })
    }).expect(200)

    const [entry] = (await readStoredAppStreamEntries()).filter(
      (candidate) => candidate.name === 'both-ways'
    )

    await request(app)
      .delete('/SASjsApi/drive/deploy')
      .auth(accessToken, { type: 'bearer' })
      .send({ id: entry.id })
      .expect(200)

    expect(await fileExists(onDisk('apps', 'both-ways'))).toBe(false)
    expect(
      (await readStoredAppStreamEntries()).find(
        (candidate) => candidate.id === entry.id
      )
    ).toBeUndefined()
  })
})
