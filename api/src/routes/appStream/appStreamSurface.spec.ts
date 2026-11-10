import path from 'path'
import { createFile, deleteFolder } from '@sasjs/utils'
import { Express } from 'express'
import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'

import * as fileUtilModules from '../../utils/file'

const tmpFolder = path.join(
  process.cwd(),
  `tmp-appstream-surface-${process.pid}`
)
const driveFolder = path.join(tmpFolder, 'files')

jest
  .spyOn(fileUtilModules, 'getFilesFolder')
  .mockImplementation(() => driveFolder)
jest
  .spyOn(fileUtilModules, 'getAppStreamConfigPath')
  .mockImplementation(() => path.join(tmpFolder, 'appStreamConfig.json'))

import appPromise from '../../app'
import {
  PermissionController,
  PermissionSettingForRoute,
  PermissionType,
  PrincipalType,
  UserController
} from '../../controllers/'
import {
  appStreamService,
  generateAccessToken,
  getAuthorizedRoutes,
  readStoredAppStreamEntries,
  refreshAppStreamIndex,
  saveTokensInDB,
  writeStoredAppStreamEntries
} from '../../utils'

const clientId = 'someclientID'

const MARIO = '0b9a1c2d-3e4f-4a5b-8c6d-7e8f9a0b1c2d'
const SONIC = 'f1e2d3c4-b5a6-4c7d-8e9f-0a1b2c3d4e5f'

/**
 * The App Stream surface, as this host serves it.
 *
 * What the package decides - the listing's shape, escaping, the cache headers,
 * what a missing app answers - is pinned in `@sasjs/api`'s own suite and in the
 * conformance corpus, and is not repeated here. What is this host's is the
 * transport and the permission model: that a tile is only drawn for an app the
 * caller holds a grant on, that the same rule decides the JSON listing and the
 * app's own route, and that an old name-shaped URL is a `404` rather than a
 * guess.
 */
describe('App Stream surface', () => {
  let app: Express
  let con: Mongoose
  let mongoServer: MongoMemoryServer
  const userController = new UserController()
  const permissionController = new PermissionController()

  const admin = {
    displayName: 'Test Admin',
    username: 'surfaceAdmin',
    password: 'adminPassword',
    isAdmin: true,
    isActive: true
  }

  const streamUser = {
    displayName: 'Stream User',
    username: 'surfaceUser',
    password: 'userPassword',
    isAdmin: false,
    isActive: true
  }

  const tokenFor = async (username: string) => {
    const user = await userController.getUserByUsername(
      { user: { isAdmin: false } } as any,
      username
    )
    const token = generateAccessToken({ clientId, userId: user.uid })
    await saveTokensInDB(user.uid, clientId, token, 'refreshToken')

    return { token, uid: user.uid }
  }

  const rule = (
    path: string,
    setting: PermissionSettingForRoute,
    principalId: string
  ) =>
    permissionController.createPermission({
      path,
      type: PermissionType.route,
      setting,
      principalType: PrincipalType.user,
      principalId
    })

  beforeAll(async () => {
    app = await appPromise

    mongoServer = await MongoMemoryServer.create()
    con = await mongoose.connect(mongoServer.getUri())

    await userController.createUser(admin)
    await userController.createUser(streamUser)

    // Two apps, deployed: the folder is what the surface serves assets out of,
    // and the index is what says the folder is an app.
    for (const [name, folder] of [
      ['Mario', 'mario'],
      ['Sonic', 'sonic']
    ]) {
      const deployment = path.join(
        driveFolder,
        'Public',
        'app',
        folder,
        'services',
        'web'
      )

      await createFile(
        path.join(deployment, 'index.html'),
        `<h1>${name}</h1><script src="main.4f3a9c1d.js"></script>`
      )
      await createFile(
        path.join(deployment, 'main.4f3a9c1d.js'),
        'console.log(1)'
      )
    }

    await writeStoredAppStreamEntries([
      {
        id: MARIO,
        name: 'Mario',
        appLoc: '/Public/app/mario',
        streamWebFolder: 'web',
        logo: 'logo.png',
        publishedAt: '2026-11-01T10:00:00.000Z'
      },
      {
        id: SONIC,
        name: 'Sonic',
        appLoc: '/Public/app/sonic',
        streamWebFolder: 'web',
        publishedAt: '2026-11-02T10:00:00.000Z'
      }
    ])
    await refreshAppStreamIndex()
  })

  afterAll(async () => {
    await writeStoredAppStreamEntries([])
    await refreshAppStreamIndex()
    await deleteFolder(tmpFolder)

    await con.connection.dropDatabase()
    await con.connection.close()
    await mongoServer.stop()
  })

  afterEach(async () => {
    await con.connection.collection('permissions').deleteMany({})
  })

  it('answers 401 without an access token', async () => {
    await request(app).get('/app/').expect(401)
  })

  it('serves the landing page to a caller holding no grants, listing nothing', async () => {
    const { token } = await tokenFor(streamUser.username)

    const res = await request(app)
      .get('/app/')
      .auth(token, { type: 'bearer' })
      .expect(200)

    expect(res.text).not.toContain('Mario')
    expect(res.text).not.toContain('Sonic')
  })

  it('lists only the app the caller is granted, by its id', async () => {
    const { token, uid } = await tokenFor(streamUser.username)

    await rule(`/AppStream/${MARIO}`, PermissionSettingForRoute.grant, uid)

    const page = await request(app)
      .get('/app/')
      .auth(token, { type: 'bearer' })
      .expect(200)

    expect(page.text).toContain(`/app/${MARIO}/`)
    expect(page.text).not.toContain(`/app/${SONIC}/`)

    const json = await request(app)
      .get('/app/apps.json')
      .auth(token, { type: 'bearer' })
      .expect(200)

    expect(json.body.apps.map((row: any) => row.id)).toEqual([MARIO])

    // and the app it lists is the one that opens, while the other is refused by
    // the gate before the surface is reached
    await request(app)
      .get(`/app/${MARIO}/`)
      .auth(token, { type: 'bearer' })
      .expect(200)

    await request(app)
      .get(`/app/${SONIC}/`)
      .auth(token, { type: 'bearer' })
      .expect(401)
  })

  it('keeps a grant written before apps had an id working', async () => {
    const { token, uid } = await tokenFor(streamUser.username)

    // every rule in an existing deployment names an app by its label
    await rule('/AppStream/Mario', PermissionSettingForRoute.grant, uid)

    const json = await request(app)
      .get('/app/apps.json')
      .auth(token, { type: 'bearer' })
      .expect(200)

    expect(json.body.apps.map((row: any) => row.id)).toEqual([MARIO])

    // and the tile it lists opens: the gate decides the app on the path that
    // admits it, so a label rule that lists the app also serves it
    await request(app)
      .get(`/app/${MARIO}/`)
      .auth(token, { type: 'bearer' })
      .expect(200)
  })

  it('answers the listing on the old prefix too, which is the same surface', async () => {
    const { token } = await tokenFor(admin.username)

    const short = await request(app)
      .get('/app/apps.json')
      .auth(token, { type: 'bearer' })
      .expect(200)

    const canonical = await request(app)
      .get('/AppStream/apps.json')
      .auth(token, { type: 'bearer' })
      .expect(200)

    expect(canonical.body).toEqual(short.body)
  })

  it('lists every app for an admin', async () => {
    const { token } = await tokenFor(admin.username)

    const json = await request(app)
      .get('/app/apps.json')
      .auth(token, { type: 'bearer' })
      .expect(200)

    expect(json.body.apps.map((row: any) => row.id)).toEqual([MARIO, SONIC])
  })

  it('leaves out an app the caller is denied, even while the stream is granted', async () => {
    const { token, uid } = await tokenFor(streamUser.username)

    await rule('/AppStream', PermissionSettingForRoute.grant, uid)
    await rule(`/AppStream/${MARIO}`, PermissionSettingForRoute.deny, uid)

    const json = await request(app)
      .get('/app/apps.json')
      .auth(token, { type: 'bearer' })
      .expect(200)

    expect(json.body.apps.map((row: any) => row.id)).toEqual([SONIC])

    // the deny on the app outranks the grant on the stream, so the app's own
    // URL is refused rather than served under the stream-wide grant
    await request(app)
      .get(`/app/${MARIO}/`)
      .auth(token, { type: 'bearer' })
      .expect(401)
  })

  it('serves an app’s own files from its deployment', async () => {
    const { token } = await tokenFor(admin.username)

    const res = await request(app)
      .get(`/app/${MARIO}/index.html`)
      .auth(token, { type: 'bearer' })
      .expect(200)

    expect(res.text).toContain('<h1>Mario</h1>')

    // index.html is revalidated, or a browser keeps the previous deployment's
    // shell against the new bundle; a content-hashed name is immutable
    expect(res.headers['cache-control']).toContain('must-revalidate')

    const asset = await request(app)
      .get(`/app/${MARIO}/main.4f3a9c1d.js`)
      .auth(token, { type: 'bearer' })
      .expect(200)

    expect(asset.headers['cache-control']).toContain('immutable')
  })

  it('redirects an app root without a trailing slash', async () => {
    const { token } = await tokenFor(admin.username)

    const res = await request(app)
      .get(`/app/${MARIO}`)
      .auth(token, { type: 'bearer' })
      .expect(301)

    expect(res.headers.location).toBe(`/app/${MARIO}/`)
  })

  it('opens an app named by its label, when only one app holds it', async () => {
    // A bookmark of the old `/AppStream/<name>/` shape. The label is not an
    // identity, so the package resolves it only when exactly one app answers to
    // it - which is the only thing the bookmark could have meant.
    const { token } = await tokenFor(admin.username)

    const res = await request(app)
      .get('/AppStream/Mario/')
      .auth(token, { type: 'bearer' })
      .expect(200)

    expect(res.text).toContain('<h1>Mario</h1>')
  })

  it('404s a label two apps share, rather than guessing which one it meant', async () => {
    const { token } = await tokenFor(admin.username)

    // a second app under the same label, which publishing allows: a label is
    // what a tile says, not what an app is
    await writeStoredAppStreamEntries([
      ...(await readStoredAppStreamEntries()),
      {
        id: '3f1c2d3e-4a5b-4c6d-8e7f-8a9b0c1d2e3f',
        name: 'Mario',
        appLoc: '/Public/app/mario-two',
        streamWebFolder: 'web',
        publishedAt: '2026-11-03T10:00:00.000Z'
      }
    ])
    await refreshAppStreamIndex()

    try {
      await request(app)
        .get('/app/Mario/')
        .auth(token, { type: 'bearer' })
        .expect(404)
    } finally {
      await writeStoredAppStreamEntries(
        (await readStoredAppStreamEntries()).filter(
          (entry) => entry.id !== '3f1c2d3e-4a5b-4c6d-8e7f-8a9b0c1d2e3f'
        )
      )
      await refreshAppStreamIndex()
    }
  })

  it('opens an app whose label is not a URL path, and refuses an encoded climb', async () => {
    const { token } = await tokenFor(admin.username)

    // A label is the folder's last segment as spelled, so it may hold a space -
    // which means an app can only be addressed by a URL that encodes it. The id
    // is what the 301 goes to, so the encoded spelling never becomes an app's
    // own URL.
    const SPACED = '7a7b7c7d-2e2f-4a4b-8c8d-9e9f0a1b2c3d'
    const deployment = path.join(
      driveFolder,
      'Public',
      'app',
      'my app',
      'services',
      'web'
    )

    await createFile(path.join(deployment, 'index.html'), '<h1>My App</h1>')
    await createFile(path.join(tmpFolder, 'secret.txt'), 'not yours')

    await writeStoredAppStreamEntries([
      ...(await readStoredAppStreamEntries()),
      {
        id: SPACED,
        name: 'My App',
        appLoc: '/Public/app/my app',
        streamWebFolder: 'web',
        publishedAt: '2026-11-04T10:00:00.000Z'
      }
    ])
    await refreshAppStreamIndex()

    try {
      const page = await request(app)
        .get('/app/My%20App/')
        .auth(token, { type: 'bearer' })
        .expect(200)

      expect(page.text).toContain('<h1>My App</h1>')

      const root = await request(app)
        .get('/app/My%20App')
        .auth(token, { type: 'bearer' })
        .expect(301)

      expect(root.headers.location).toBe(`/app/${SPACED}/`)

      // a segment that decodes to a climb is the drive's containment refusing,
      // which the package reports as "nothing here" rather than as a file
      const climb = await request(app)
        .get('/app/My%20App/..%2f..%2f..%2f..%2fsecret.txt')
        .auth(token, { type: 'bearer' })
        .expect(404)

      expect(climb.text).not.toContain('not yours')
    } finally {
      await writeStoredAppStreamEntries(
        (await readStoredAppStreamEntries()).filter(
          (entry) => entry.id !== SPACED
        )
      )
      await refreshAppStreamIndex()
    }
  })

  it('still redirects the old landing page to the short one', async () => {
    const res = await request(app).get('/AppStream').expect(301)

    expect(res.headers.location).toBe('/app')
  })

  it('refuses to remove an app to a caller who may only open it', async () => {
    const { token, uid } = await tokenFor(streamUser.username)

    await rule(`/AppStream/${SONIC}`, PermissionSettingForRoute.grant, uid)

    // the app grant is enough to open it...
    await request(app)
      .get(`/app/${SONIC}/`)
      .auth(token, { type: 'bearer' })
      .expect(200)

    // ...and not to take it down: removal is the deploy route's permission,
    // which is what `DELETE /SASjsApi/drive/deploy` asks for and what the
    // interface gates the bin on. The surface's `allow` is a view filter, and
    // passing it here would let everyone who can see an app delete it.
    const agent = request.agent(app)
    const landing = await agent
      .get('/app/')
      .auth(token, { type: 'bearer' })
      .expect(200)
    const cookie = ([] as string[])
      .concat(landing.headers['set-cookie'] ?? [])
      .map((line: string) => line.split(';')[0])
      .find((pair: string) => pair.startsWith('XSRF-TOKEN=')) as string

    await agent
      .delete(`/app/${SONIC}`)
      .set('X-XSRF-TOKEN', decodeURIComponent(cookie.split('=')[1]))
      .auth(token, { type: 'bearer' })
      .expect(401)

    expect(await readStoredAppStreamEntries()).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: SONIC })])
    )
  })

  it('removes an app for a caller holding only the deploy grant', async () => {
    const { token, uid } = await tokenFor(streamUser.username)

    // The bin in the interface is offered on this grant alone, so the API has to
    // accept it alone: removal is the deploy route's permission, and the app
    // grant is what opens an app rather than what takes it down.
    await rule('/SASjsApi/drive/deploy', PermissionSettingForRoute.grant, uid)

    const entry = await appStreamService().publish({
      appLoc: '/Public/app/spare',
      streamWebFolder: 'web',
      name: 'Spare'
    })
    await refreshAppStreamIndex()

    const agent = request.agent(app)
    const landing = await agent
      .get('/app/')
      .auth(token, { type: 'bearer' })
      .expect(200)
    const cookie = ([] as string[])
      .concat(landing.headers['set-cookie'] ?? [])
      .map((line: string) => line.split(';')[0])
      .find((pair: string) => pair.startsWith('XSRF-TOKEN=')) as string

    const removed = await agent
      .delete(`/app/${entry.id}`)
      .set('X-XSRF-TOKEN', decodeURIComponent(cookie.split('=')[1]))
      .auth(token, { type: 'bearer' })
      .expect(200)

    expect(removed.body.app).toMatchObject({ id: entry.id, name: 'Spare' })
    expect(getAuthorizedRoutes()).not.toContain(`/AppStream/${entry.id}`)
  })

  it('removes an app by its id, never by a label', async () => {
    const { token } = await tokenFor(admin.username)

    const agent = request.agent(app)
    const landing = await agent
      .get('/app/')
      .auth(token, { type: 'bearer' })
      .expect(200)
    const cookie = ([] as string[])
      .concat(landing.headers['set-cookie'] ?? [])
      .map((line: string) => line.split(';')[0])
      .find((pair: string) => pair.startsWith('XSRF-TOKEN=')) as string

    // A label resolves for opening - a bookmark of an older URL - but it is not
    // an identity, and a removal that named one could take down an app nobody
    // meant once the label is reused. The answer is the same `404` an unknown
    // app gets, so a caller cannot use it to ask whether a name is taken.
    const res = await agent
      .delete('/app/Mario')
      .set('X-XSRF-TOKEN', decodeURIComponent(cookie.split('=')[1]))
      .auth(token, { type: 'bearer' })
      .expect(404)

    expect(res.text).toContain('no App Stream')

    await request(app)
      .get(`/app/${MARIO}/`)
      .auth(token, { type: 'bearer' })
      .expect(200)
  })

  it('removes an app by id, and stops serving it', async () => {
    const { token } = await tokenFor(admin.username)

    // A state-changing request on the surface carries the CSRF token, exactly as
    // the interface sends it: the token is bound to the caller's session, travels
    // as a cookie the app can read, and is echoed in the header. An agent keeps
    // the session cookie across the two requests the way a browser does.
    const agent = request.agent(app)

    const landing = await agent
      .get('/app/')
      .auth(token, { type: 'bearer' })
      .expect(200)

    const cookie = ([] as string[])
      .concat(landing.headers['set-cookie'] ?? [])
      .map((line: string) => line.split(';')[0])
      .find((pair: string) => pair.startsWith('XSRF-TOKEN=')) as string

    const removed = await agent
      .delete(`/app/${SONIC}`)
      .set('X-XSRF-TOKEN', decodeURIComponent(cookie.split('=')[1]))
      .auth(token, { type: 'bearer' })
      .expect(200)

    expect(removed.body.app).toMatchObject({ id: SONIC, name: 'Sonic' })
    // the drive content is untouched - deleting a folder is a drive route -
    expect(await readStoredAppStreamEntries()).toEqual([
      expect.objectContaining({ id: MARIO })
    ])

    // and the route inventory has dropped it in the same breath: the gate and
    // the permission editor read that list, not the store, so an id left there
    // would be offered as a route no app is served on until the next restart
    expect(getAuthorizedRoutes()).not.toContain(`/AppStream/${SONIC}`)

    await request(app)
      .get(`/app/${SONIC}/`)
      .auth(token, { type: 'bearer' })
      .expect(404)
  })

  it('hands the CSRF token to the landing page, which the interface reads', async () => {
    const { token } = await tokenFor(admin.username)

    const res = await request(app)
      .get('/app/')
      .auth(token, { type: 'bearer' })
      .expect(200)

    expect(String(res.headers['set-cookie'])).toContain('XSRF-TOKEN=')
  })
})
