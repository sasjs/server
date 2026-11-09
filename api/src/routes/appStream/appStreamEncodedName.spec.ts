import path from 'path'
import { Express } from 'express'
import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'
import { createFolder, createFile, deleteFolder } from '@sasjs/utils'
import * as fileUtilModules from '../../utils/file'

const tmpFolder = path.join(process.cwd(), `tmp-encoded-${Date.now()}`)

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
import { UserController } from '../../controllers/'
import { generateAccessToken, saveTokensInDB } from '../../utils'
import { publishAppStream } from './index'

const clientId = 'someclientID'

/**
 * Serving an app whose name needs percent-encoding.
 *
 * `req.path` is the raw pathname, so the segment is still encoded while the
 * registry key is the name as published. Comparing them directly made such an
 * app publishable and unreachable - it answered the "no App Stream" page - and a
 * space in a name is an ordinary thing for a deployer to type. The segment is
 * decoded before it is used as a key, and only the key: the rest of the path
 * still goes to `express.static` as it arrived, for it to contain.
 */
describe('App Stream serving encoded names', () => {
  let app: Express
  let con: Mongoose
  let mongoServer: MongoMemoryServer
  const userController = new UserController()

  const admin = {
    displayName: 'Test Admin',
    username: 'adminUsername',
    password: 'adminPassword',
    isAdmin: true,
    isActive: true
  }

  let token: string

  const name = 'My App'
  const appLoc = '/Public/app/space'
  const deployment = path.join(
    tmpFolder,
    'drive',
    'files',
    'Public',
    'app',
    'space',
    'services',
    'web'
  )

  beforeAll(async () => {
    app = await appPromise

    mongoServer = await MongoMemoryServer.create()
    con = await mongoose.connect(mongoServer.getUri())

    const user = await userController.createUser(admin)
    token = generateAccessToken({ clientId, userId: user.uid })
    await saveTokensInDB(user.uid, clientId, token, 'refreshToken')

    // a deployment that exists, so publishing records it
    await createFolder(deployment)
    await createFile(
      path.join(deployment, 'index.html'),
      '<html>space app</html>'
    )
    await createFile(path.join(deployment, 'app.js'), 'console.log(1)')

    await publishAppStream(appLoc, 'web', name)
  })

  afterAll(async () => {
    process.appStreamConfig = {}

    await con.connection.dropDatabase()
    await con.connection.close()
    await mongoServer.stop()
    await deleteFolder(tmpFolder)
  })

  it('should serve an app whose name needs encoding', async () => {
    const res = await request(app)
      .get('/app/My%20App/')
      .auth(token, { type: 'bearer' })
      .expect(200)

    expect(res.text).toContain('space app')
  })

  it('should redirect the base url to its trailing-slash form, still encoded', async () => {
    const res = await request(app)
      .get('/app/My%20App')
      .auth(token, { type: 'bearer' })
      .expect(301)

    expect(res.headers.location).toBe('My%20App/')
  })

  it('should serve an asset of that app', async () => {
    await request(app)
      .get('/app/My%20App/app.js')
      .auth(token, { type: 'bearer' })
      .expect(200)
  })

  it('should keep answering the fallback for an unknown name', async () => {
    const res = await request(app)
      .get('/app/Nope%20App/')
      .auth(token, { type: 'bearer' })
      .expect(200)

    expect(res.text).toBe("There's no App Stream available here.")
  })

  it('should still refuse an encoded traversal out of the deployment', async () => {
    const res = await request(app)
      .get('/app/My%20App/..%2f..%2f..%2f..%2fetc%2fpasswd')
      .auth(token, { type: 'bearer' })

    expect(res.status).not.toBe(200)
  })
})
