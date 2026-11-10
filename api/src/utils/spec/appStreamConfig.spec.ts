import path from 'path'
import { createFile, deleteFolder, readFile } from '@sasjs/utils'

import * as fileUtilModules from '../file'
import {
  appGrantPaths,
  appStreamIds,
  fileAppStreamStore,
  readStoredAppStreamEntries,
  refreshAppStreamIndex,
  writeStoredAppStreamEntries
} from '../appStreamConfig'
import type { AppStreamEntry } from '@sasjs/api'

const tmpFolder = path.join(process.cwd(), `tmp-appstream-index-${process.pid}`)
const indexPath = path.join(tmpFolder, 'appStreamConfig.json')

jest
  .spyOn(fileUtilModules, 'getAppStreamConfigPath')
  .mockImplementation(() => indexPath)

const entry = (overrides: Partial<AppStreamEntry> = {}): AppStreamEntry => ({
  id: '0b9a1c2d-3e4f-4a5b-8c6d-7e8f9a0b1c2d',
  name: 'Mario',
  appLoc: '/Public/app/mario',
  streamWebFolder: 'web',
  publishedAt: '2026-11-01T10:00:00.000Z',
  ...overrides
})

const logger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}

describe('the app index on disk', () => {
  beforeAll(() => {
    ;(process as any).logger = logger
  })

  beforeEach(async () => {
    await deleteFolder(tmpFolder)
    logger.error.mockClear()
  })

  afterAll(async () => {
    await deleteFolder(tmpFolder)
  })

  it('answers no apps for a file that does not exist', async () => {
    expect(await readStoredAppStreamEntries()).toEqual([])
  })

  it('round-trips the entries it wrote', async () => {
    const entries = [
      entry(),
      entry({ id: 'f1e2d3c4-b5a6-4c7d-8e9f-0a1b2c3d4e5f', name: 'Sonic' })
    ]

    await writeStoredAppStreamEntries(entries)

    expect(await readStoredAppStreamEntries()).toEqual(entries)

    // the file is a list of apps, not a map keyed by name - which is the shape
    // that made a name the identity
    expect(Array.isArray(JSON.parse(await readFile(indexPath)))).toBe(true)
  })

  it('drops an entry with no valid id, and says which one', async () => {
    await writeStoredAppStreamEntries([
      entry(),
      { ...entry({ name: 'Sonic' }), id: 'not-a-uuid' }
    ] as AppStreamEntry[])

    const read = await readStoredAppStreamEntries()

    expect(read).toHaveLength(1)
    expect(read[0].name).toBe('Mario')
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('"Sonic" without a valid id')
    )
  })

  it('drops an entry that is not an object at all', async () => {
    await createFile(indexPath, JSON.stringify([entry(), 42]))

    const read = await readStoredAppStreamEntries()

    expect(read).toHaveLength(1)
    expect(logger.error).toHaveBeenCalled()
  })

  it('reports a file that is not JSON rather than answering a 500 on every listing', async () => {
    await createFile(indexPath, '{not json')

    expect(await readStoredAppStreamEntries()).toEqual([])
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('could not be read as JSON')
    )
  })

  it('reports a registry from before apps had an id, and leaves the file alone', async () => {
    // the shape a 6.x server wrote: an object keyed by the chosen name
    const old = JSON.stringify({
      Mario: { appLoc: '/Public/app/mario', streamWebFolder: 'web' }
    })

    await createFile(indexPath, old)

    expect(await readStoredAppStreamEntries()).toEqual([])
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('before apps were indexed by id')
    )
    // nothing invented, nothing rewritten: the deploy that published it can
    // register it again under a new id
    expect(await readFile(indexPath)).toBe(old)
  })

  it('is the store the package reads, so an absent file is an empty index', async () => {
    expect(await fileAppStreamStore().read()).toEqual([])

    await fileAppStreamStore().write([entry()])

    expect(await fileAppStreamStore().read()).toHaveLength(1)
  })

  it('takes the route inventory from the index, and replaces it on refresh', async () => {
    await writeStoredAppStreamEntries([entry()])
    await refreshAppStreamIndex()

    expect(appStreamIds()).toEqual([entry().id])

    await writeStoredAppStreamEntries([])
    await refreshAppStreamIndex()

    expect(appStreamIds()).toEqual([])
  })

  it('grants an app on its id and on the label it carries', () => {
    expect(appGrantPaths(entry())).toEqual([
      `/AppStream/${entry().id}`,
      '/AppStream/Mario'
    ])
  })
})
