process.env.NODE_ENV = 'test'
import path from 'path'
import os from 'os'
import fs from 'fs'
import * as fileUtilModules from '../../../utils/file'
import { ExecutionController } from '../Execution'

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'drive-timestamps-'))
const drive = path.join(tmp, 'drive', 'files')

jest.spyOn(fileUtilModules, 'getFilesFolder').mockImplementation(() => drive)

/**
 * The drive tree states when a file was written and created, so a client can
 * sort by recency without a second request per entry.
 *
 * The dates come from the filesystem, so the assertions are about their shape
 * and their placement - a fixed timestamp here would only prove that the
 * fixture had one.
 */
describe('drive tree timestamps', () => {
  beforeAll(() => {
    fs.mkdirSync(path.join(drive, 'Public', 'app'), { recursive: true })
    fs.writeFileSync(path.join(drive, 'Public', 'app', 'index.html'), '<html>')
  })

  afterAll(() => {
    fs.rmSync(tmp, { recursive: true, force: true })
  })

  const iso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/

  it('states created and modified for a file, one level at a time', () => {
    const level = new ExecutionController().buildDirectoryLevel('/Public/app')
    const file = level.children.find((child) => child.name === 'index.html')

    expect(file).toBeDefined()
    expect(file?.isFolder).toBe(false)
    expect(file?.modified).toMatch(iso)
    expect(file?.created).toMatch(iso)
  })

  it("states neither on a folder - its date would be a child's", () => {
    const tree = new ExecutionController().buildDirectoryTree()
    const publicFolder = tree.children.find((child) => child.name === 'Public')

    expect(publicFolder?.isFolder).toBe(true)
    expect(publicFolder?.modified).toBeUndefined()
    expect(publicFolder?.created).toBeUndefined()

    const appFolder = publicFolder?.children.find(
      (child) => child.name === 'app'
    )
    const file = appFolder?.children.find(
      (child) => child.name === 'index.html'
    )

    expect(appFolder?.modified).toBeUndefined()
    expect(file?.modified).toMatch(iso)
    expect(file?.created).toMatch(iso)
  })
})
