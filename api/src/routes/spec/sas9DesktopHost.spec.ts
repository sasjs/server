import fs from 'fs'
import path from 'path'
import request from 'supertest'
import SASjs from '@sasjs/adapter'
import { ServerType } from '@sasjs/utils/types'
import { ModeType, RunTimeType } from '../../utils'
import { desktopCaller } from '../../utils/desktopIdentity'

// Select the real mock web router before the full app loads its routes.
const oldMode = process.env.MODE
const oldMockServerType = process.env.MOCK_SERVERTYPE
process.env.MODE = ModeType.Desktop
process.env.MOCK_SERVERTYPE = 'sas9'
const appPromise = require('../../app').default

describe('SAS 9 mock on the desktop host', () => {
  const folder = path.join(
    process.cwd(),
    'sasjs_root',
    'drive',
    'files',
    `sas9-desktop-${process.pid}`
  )
  const program = `/sas9-desktop-${process.pid}/capture`
  const mockUser = `sas9-desktop-${process.pid}`
  const runnerFolder = path.join(
    process.cwd(),
    'sasjs_root',
    'drive',
    'files',
    'User Folders',
    mockUser
  )
  const oldRunTimes = process.runTimes
  const oldNodeLoc = process.nodeLoc

  beforeAll(async () => {
    await appPromise
    process.runTimes = [RunTimeType.JS]
    process.nodeLoc = process.execPath
    fs.mkdirSync(folder, { recursive: true })
    fs.writeFileSync(
      path.join(folder, 'capture.js'),
      `_webout = JSON.stringify({ user: _SASJS_USERNAME, method: _requestMethod, files: _WEBIN_FILE_COUNT })`
    )
    fs.mkdirSync(path.join(runnerFolder, 'My Folder', 'sasjs'), {
      recursive: true
    })
    fs.writeFileSync(
      path.join(runnerFolder, 'My Folder', 'sasjs', 'runner.js'),
      `_webout = '{}'`
    )
  })

  afterAll(() => {
    fs.rmSync(folder, { recursive: true, force: true })
    fs.rmSync(runnerFolder, { recursive: true, force: true })
    process.runTimes = oldRunTimes
    process.nodeLoc = oldNodeLoc
    if (oldMode === undefined) delete process.env.MODE
    else process.env.MODE = oldMode
    if (oldMockServerType === undefined) delete process.env.MOCK_SERVERTYPE
    else process.env.MOCK_SERVERTYPE = oldMockServerType
  })

  it('runs the installed SAS 9 adapter with query login and a multipart table', async () => {
    const app = await appPromise
    const server = app.listen(0, '127.0.0.1')
    try {
      await new Promise<void>((resolve) => server.once('listening', resolve))
      const port = (server.address() as { port: number }).port
      const client = new SASjs({
        serverType: ServerType.Sas9,
        serverUrl: `http://127.0.0.1:${port}`
      })
      const result = await client.request(
        program,
        { table: [{ id: 1 }] },
        { username: mockUser, password: 'secret' }
      )
      expect(result).toMatchObject({
        status: 200,
        result: { method: 'POST', files: 1 }
      })
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((error: Error | undefined) =>
          error ? reject(error) : resolve()
        )
      )
    }
  })

  it('runs GET with URL mock credentials and then an adapter-style multipart POST', async () => {
    const app = await appPromise
    const get = await request(app)
      .get(
        `/SASStoredProcess/do?_program=${program}&_username=alice&_password=secret`
      )
      .expect(200)
    expect(JSON.parse(get.text)).toMatchObject({ method: 'GET', user: 'demo' })
    const post = await request(app)
      .post(`/SASStoredProcess/do?_program=${program}`)
      .attach('table', Buffer.from('id\n1'), 'table.csv')
      .expect(200)
    expect(JSON.parse(post.text)).toMatchObject({
      method: 'POST',
      user: (await desktopCaller()).username,
      files: 1
    })
  })
})
