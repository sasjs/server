import path from 'path'
import { Express } from 'express'
import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'
import { deleteFolder, fileExists, readFile } from '@sasjs/utils'
import * as fileUtilModules from '../../utils/file'

const tmpFolder = path.join(process.cwd(), `tmp-unpublish-${Date.now()}`)

jest
  .spyOn(fileUtilModules, 'getSasjsRootFolder')
  .mockImplementation(() => tmpFolder)
jest
  .spyOn(fileUtilModules, 'getSasjsDriveFolder')
  .mockImplementation(() => path.join(tmpFolder, 'drive'))
jest
  .spyOn(fileUtilModules, 'getFilesFolder')
  .mockImplementation(() => path.join(tmpFolder, 'drive', 'files'))

import appPromise from '../../app'
import {
  PermissionController,
  PermissionSettingForRoute,
  PermissionType,
  PrincipalType,
  UserController
} from '../../controllers/'
import { generateAccessToken, saveTokensInDB } from '../../utils'
import { getAppStreamConfigPath } from '../../utils/file'

const clientId = 'someclientID'

/**
 * Unpublishing an app stream entry.
 *
 * `POST /SASjsApi/drive/deploy` publishes an app: it writes a registry entry that
 * the landing page, its HTML index and `/AppStream/apps.json` are built from, and
 * it points the static handler at the deployment's folder. Before this route the
 * only way back was editing `appStreamConfig.json` on the host and restarting -
 * so a stale entry kept being advertised, and following its link answered 401 or
 * 404. These cases pin the operation that undoes publishing, and the two things
 * it must NOT do: touch the caller's files, or take down a name that has since
 * been published for a different folder.
 */
describe('App Stream unpublish', () => {
  let app: Express
  let con: Mongoose
  let mongoServer: MongoMemoryServer
  const userController = new UserController()
  const permissionController = new PermissionController()

  const admin = {
    displayName: 'Test Admin',
    username: 'adminUsername',
    password: 'adminPassword',
    isAdmin: true,
    isActive: true
  }

  const streamUser = {
    displayName: 'Stream User',
    username: 'streamUsername',
    password: 'userPassword',
    isAdmin: false,
    isActive: true
  }

  const appLoc = '/Public/app/torrents'
  const streamServiceName = 'Torrents'

  let adminToken: string
  let userToken: string
  let userUid: string

  const tokenFor = async (username: string) => {
    const user = await userController.getUserByUsername(
      { user: { isAdmin: false } } as any,
      username
    )
    const token = generateAccessToken({ clientId, userId: user.uid })
    await saveTokensInDB(user.uid, clientId, token, 'refreshToken')

    return { token, uid: user.uid }
  }

  /** The registry as it is on disk - what survives a restart. */
  const registryOnDisk = async () => {
    const configPath = getAppStreamConfigPath()

    return (await fileExists(configPath))
      ? JSON.parse(await readFile(configPath))
      : {}
  }

  /** Publishes an app the way `sasjs deploy` does: a file tree under appLoc. */
  const publish = async (name: string, loc: string = appLoc) =>
    request(app)
      .post('/SASjsApi/drive/deploy')
      .auth(adminToken, { type: 'bearer' })
      .send({
        appLoc: loc,
        streamServiceName: name,
        streamWebFolder: 'web',
        fileTree: {
          members: [
            {
              name: 'services',
              type: 'folder',
              members: [
                {
                  name: 'web',
                  type: 'folder',
                  members: [
                    {
                      name: 'index.html',
                      type: 'file',
                      code: Buffer.from('<html>Torrents</html>').toString(
                        'base64'
                      )
                    }
                  ]
                }
              ]
            }
          ]
        }
      })

  const listedApps = async () => {
    const res = await request(app)
      .get('/AppStream/apps.json')
      .auth(adminToken, { type: 'bearer' })
      .expect(200)

    return res.body.apps.map((app: { name: string }) => app.name)
  }

  const unpublish = (
    body: Record<string, unknown>,
    token: string = adminToken
  ) =>
    request(app)
      .delete('/SASjsApi/drive/deploy')
      .auth(token, { type: 'bearer' })
      .send(body)

  beforeAll(async () => {
    app = await appPromise

    mongoServer = await MongoMemoryServer.create()
    con = await mongoose.connect(mongoServer.getUri())

    await userController.createUser(admin)
    await userController.createUser(streamUser)

    adminToken = (await tokenFor(admin.username)).token
    const user = await tokenFor(streamUser.username)
    userToken = user.token
    userUid = user.uid
  })

  afterAll(async () => {
    process.appStreamConfig = {}

    await con.connection.dropDatabase()
    await con.connection.close()
    await mongoServer.stop()
    await deleteFolder(tmpFolder)
  })

  afterEach(async () => {
    await con.connection.collection('permissions').deleteMany({})
  })

  it('should remove the entry from the listing, the registry and the app route', async () => {
    await publish(streamServiceName)

    expect(await listedApps()).toContain(streamServiceName)
    expect(Object.keys(await registryOnDisk())).toContain(streamServiceName)

    // the app is served while it is published
    const published = await request(app)
      .get(`/AppStream/${streamServiceName}/`)
      .auth(adminToken, { type: 'bearer' })
      .expect(200)

    expect(published.text).toContain('Torrents')

    const res = await unpublish({ appLoc, streamServiceName }).expect(200)

    expect(res.body).toEqual({ status: 'success' })

    // gone from both listings and from the file a restart reloads
    expect(await listedApps()).not.toContain(streamServiceName)
    expect(Object.keys(await registryOnDisk())).not.toContain(streamServiceName)

    // and it stops being served: the name is no longer in the map the static
    // handler reads, so the request falls through to the fallback
    const served = await request(app)
      .get(`/AppStream/${streamServiceName}/`)
      .auth(adminToken, { type: 'bearer' })

    expect(served.text).toBe("There's no App Stream available here.")
  })

  it('should leave the deployed files alone', async () => {
    await publish(streamServiceName)

    await unpublish({ appLoc, streamServiceName }).expect(200)

    // unpublishing is not deleting: the folder, and the app inside it, are
    // still on the drive and still readable through the drive API
    await request(app)
      .get('/SASjsApi/drive/folder')
      .auth(adminToken, { type: 'bearer' })
      .query({ _folderPath: `${appLoc}/services/web` })
      .expect(200)

    await request(app)
      .get('/SASjsApi/drive/file')
      .auth(adminToken, { type: 'bearer' })
      .query({ _filePath: `${appLoc}/services/web/index.html` })
      .expect(200)
  })

  it('should answer 404 for a name the registry does not hold', async () => {
    const res = await unpublish({
      appLoc: '/Public/app/nothing',
      streamServiceName: 'Nothing'
    }).expect(404)

    expect(res.text).toBe('No such app stream entry.')
  })

  it('should answer 404, and leave the entry, when the appLoc does not match', async () => {
    await publish(streamServiceName)

    // a name published from a different folder is a different app: removing it
    // by the pair that no longer matches must not take the newer one down
    const res = await unpublish({
      appLoc: '/Public/app/elsewhere',
      streamServiceName
    }).expect(404)

    expect(res.text).toBe('No such app stream entry.')
    expect(await listedApps()).toContain(streamServiceName)

    await unpublish({ appLoc, streamServiceName }).expect(200)
  })

  it('should answer 404 for a second removal of the same entry', async () => {
    await publish(streamServiceName)

    await unpublish({ appLoc, streamServiceName }).expect(200)
    await unpublish({ appLoc, streamServiceName }).expect(404)
  })

  it('should answer 400 when the payload names no stream', async () => {
    const res = await unpublish({ appLoc }).expect(400)

    expect(res.text).toBe('"streamServiceName" is required')
  })

  it('should answer 400 when the payload names no appLoc', async () => {
    const res = await unpublish({ streamServiceName }).expect(400)

    expect(res.text).toBe('"appLoc" is required')
  })

  it('should require the grant the deploy routes already require', async () => {
    await publish(streamServiceName)

    // authenticated, but holding no rule on /SASjsApi/drive/deploy
    await unpublish({ appLoc, streamServiceName }, userToken).expect(401)

    expect(await listedApps()).toContain(streamServiceName)

    // and the same grant that publishes admits the removal
    await permissionController.createPermission({
      type: PermissionType.route,
      principalType: PrincipalType.user,
      setting: PermissionSettingForRoute.grant,
      path: '/SASjsApi/drive/deploy',
      principalId: userUid
    })

    await unpublish({ appLoc, streamServiceName }, userToken).expect(200)

    expect(await listedApps()).not.toContain(streamServiceName)
  })
})
