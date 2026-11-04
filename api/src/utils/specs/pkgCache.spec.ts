import fs from 'fs'
import os from 'os'
import path from 'path'

import { configurePkgCache, staleAfterMs } from '../pkgCache'

/**
 * The cache pkg extracts assets into is invisible and unbounded unless this
 * server takes charge of it - sasjs/server#523. These cases pin the four parts
 * of that: where it goes, that the operator can still choose, that a folder is
 * there only while its process is, and that a sweep cannot mistake a live
 * instance's folder for a dead one.
 */
describe('configurePkgCache', () => {
  let root: string
  let exitHandlers: Array<() => void>

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'sasjs-pkg-cache-'))
    exitHandlers = []

    delete process.env.PKG_NATIVE_CACHE_PATH

    jest.spyOn(process, 'once').mockImplementation(((
      event: string,
      handler: () => void
    ) => {
      if (event === 'exit') exitHandlers.push(handler)

      return process
    }) as any)
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
    delete process.env.PKG_NATIVE_CACHE_PATH
    fs.rmSync(root, { recursive: true, force: true })
  })

  it('leaves a plain node process alone', () => {
    const folder = configurePkgCache({ packaged: false, root })

    expect(folder).toBeUndefined()
    expect(process.env.PKG_NATIVE_CACHE_PATH).toBeUndefined()
    expect(fs.existsSync(path.join(root, 'tmp'))).toBe(false)
  })

  it('directs an executable to a folder of its own inside the data root', () => {
    const folder = configurePkgCache({ packaged: true, root })

    // the pid is there for a human reading a directory listing; the random id is
    // what keeps two instances - two containers that are both pid 1, say - apart
    expect(folder).toMatch(
      new RegExp(`^${root}/tmp/pkg-cache-${process.pid}-[0-9a-f-]{36}$`)
    )
    expect(process.env.PKG_NATIVE_CACHE_PATH).toBe(folder)
    expect(fs.existsSync(folder!)).toBe(true)
  })

  it('gives separate instances separate folders', () => {
    const first = configurePkgCache({ packaged: true, root })

    // a second instance resolves its own folder; the variable is per process
    delete process.env.PKG_NATIVE_CACHE_PATH

    const second = configurePkgCache({ packaged: true, root })

    expect(second).not.toBe(first)
  })

  it('honours a PKG_NATIVE_CACHE_PATH the operator has set', () => {
    process.env.PKG_NATIVE_CACHE_PATH = '/somewhere/else'

    const folder = configurePkgCache({ packaged: true, root })

    expect(folder).toBeUndefined()
    expect(process.env.PKG_NATIVE_CACHE_PATH).toBe('/somewhere/else')
  })

  it('removes its folder on exit, which is where pkg does not', () => {
    const folder = configurePkgCache({ packaged: true, root })!

    expect(exitHandlers).toHaveLength(1)

    exitHandlers[0]()

    expect(fs.existsSync(folder)).toBe(false)
  })

  it('keeps its folder while the heartbeat is refreshing it', () => {
    jest.useFakeTimers()

    const folder = configurePkgCache({ packaged: true, root })!
    const started = fs.statSync(folder).mtimeMs

    jest.advanceTimersByTime(60 * 60 * 1000)

    // the heartbeat has to move the folder's OWN timestamp: pkg writes into the
    // folder below this one, which leaves this one's mtime untouched
    expect(fs.statSync(folder).mtimeMs).toBeGreaterThan(started)
  })

  it('sweeps a folder no instance is refreshing, and keeps a recent one', () => {
    const tmpFolder = path.join(root, 'tmp')
    const staleFolder = path.join(tmpFolder, 'pkg-cache-99991-abc')
    const liveFolder = path.join(tmpFolder, 'pkg-cache-99992-def')
    const now = Date.now()

    fs.mkdirSync(staleFolder, { recursive: true })
    fs.mkdirSync(liveFolder, { recursive: true })

    const old = new Date(now - staleAfterMs - 60_000)

    fs.utimesSync(staleFolder, old, old)

    configurePkgCache({ packaged: true, root, now })

    expect(fs.existsSync(staleFolder)).toBe(false)
    expect(fs.existsSync(liveFolder)).toBe(true)
  })

  it('sweeps only folders it named', () => {
    const tmpFolder = path.join(root, 'tmp')
    const other = path.join(tmpFolder, 'unrelated')
    const now = Date.now()

    fs.mkdirSync(other, { recursive: true })

    const old = new Date(now - staleAfterMs - 60_000)

    fs.utimesSync(other, old, old)

    configurePkgCache({ packaged: true, root, now })

    expect(fs.existsSync(other)).toBe(true)
  })
})
