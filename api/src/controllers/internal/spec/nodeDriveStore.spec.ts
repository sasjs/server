process.env.NODE_ENV = 'test'
import { nodeDriveStore } from '../nodeDriveStore'
import * as fileUtilModules from '../../../utils/file'
import path from 'path'
import os from 'os'
import fs from 'fs'

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'node-drive-store-'))
jest
  .spyOn(fileUtilModules, 'getFilesFolder')
  .mockImplementation(() => path.join(tmp, 'drive', 'files'))

/**
 * The storage port over node's fs: the eight operations the drive service
 * calls, exercised directly over a temp folder, so a port defect fails here
 * rather than through an HTTP layer that adds its own moving parts.
 */
describe('node drive store', () => {
  afterAll(() => {
    fs.rmSync(tmp, { recursive: true, force: true })
  })

  it('writes and reads through the port', async () => {
    const store = nodeDriveStore()
    await store.mkdirp('/data')
    await store.write('/data/a.csv', 'a,b\n1,2\n')
    expect(await store.exists('/data/a.csv')).toBe(true)
    const stat = await store.stat('/data/a.csv')
    expect(stat.directory).toBe(false)
    const listing = await store.list('/')
    expect(listing.folders).toContain('data')
    const contents = await store.read('/data/a.csv')
    expect(contents.toString()).toBe('a,b\n1,2\n')
    await store.move('/data/a.csv', '/data/b.csv')
    expect(await store.exists('/data/b.csv')).toBe(true)
    await store.remove('/data')
    expect(await store.exists('/data/b.csv')).toBe(false)
  })

  it('refuses a path that climbs out of the drive', async () => {
    const store = nodeDriveStore()
    await expect(store.read('../escape.csv')).rejects.toThrow(
      /outside the drive/
    )
    await expect(store.read('/../../escape.csv')).rejects.toThrow(
      /outside the drive/
    )
  })

  it('refuses a symlink that points outside the drive', async () => {
    const store = nodeDriveStore()
    // a link INSIDE the drive naming a target outside it: the lexical check
    // passes, the real-path check must refuse
    const outside = path.join(tmp, 'outside-secret')
    const link = path.join(tmp, 'drive', 'files', 'escape-link')
    fs.mkdirSync(path.dirname(link), { recursive: true })
    fs.writeFileSync(outside, 'not yours')
    fs.symlinkSync(outside, link)

    await expect(store.read('/escape-link')).rejects.toThrow(
      /outside the drive/
    )
    // an escaping link is a refusal, not a miss: exists propagates the
    // refusal the read gave, so the service cannot mistake it for a 404
    await expect(store.exists('/escape-link')).rejects.toThrow(
      /outside the drive/
    )
    fs.rmSync(outside, { force: true })
  })

  it('serves a file as text when the UTF-8 round trip is lossless, and as bytes when it is not', async () => {
    const store = nodeDriveStore()
    await store.mkdirp('/bin')
    await store.write('/bin/logo.png', Buffer.from([0x89, 0x50, 0x4e, 0x47]))
    const contents = await store.read('/bin/logo.png')
    expect(contents).toBeInstanceOf(Uint8Array)
    const bytes = Buffer.from(contents as Uint8Array)
    expect(bytes.length).toBe(4)
    expect(bytes[0]).toBe(0x89)
    expect(bytes[1]).toBe(0x50)
    expect(bytes[2]).toBe(0x4e)
    expect(bytes[3]).toBe(0x47)
  })
})
