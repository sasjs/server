import fs from 'fs'
import os from 'os'
import path from 'path'

import {
  DEFAULT_LOG_LINES,
  MAX_LOG_LINES,
  getBuildInfo,
  formatBuildInfo
} from '..'
import {
  getFolderUsage,
  getFilesystemUsage,
  getLogFolderSummary,
  getProcessMetrics,
  listLogFiles,
  readLogTail,
  resolveLogFile
} from '../systemMetrics'

const makeTempDir = (): string =>
  fs.mkdtempSync(path.join(os.tmpdir(), 'sasjs-admin-'))

const writeLines = (filePath: string, count: number) => {
  const lines = Array.from({ length: count }, (_, i) => `line ${i + 1}`)

  fs.writeFileSync(filePath, lines.join('\n') + '\n')
}

describe('buildInfo', () => {
  it('reports a version and a hash', () => {
    const info = getBuildInfo()

    expect(typeof info.version).toBe('string')
    expect(info.version.length).toBeGreaterThan(0)
    expect(typeof info.gitHash).toBe('string')
  })

  it('formats the version with the commit for a support ticket', () => {
    const formatted = formatBuildInfo({
      version: 'v3.2.2',
      gitHash: '4a26a3d',
      buildDate: '2026-10-27T19:41:38.000Z'
    })

    expect(formatted).toBe('v3.2.2 (4a26a3d)')
  })

  it('says so when the build date is unknown', () => {
    expect(
      formatBuildInfo({ version: 'dev', gitHash: 'unknown', buildDate: null })
    ).toContain('build date unknown')
  })
})

describe('getFolderUsage', () => {
  it('totals the files in a folder and its subfolders', async () => {
    const root = makeTempDir()
    fs.writeFileSync(path.join(root, 'a.txt'), 'hello')
    fs.mkdirSync(path.join(root, 'nested'))
    fs.writeFileSync(path.join(root, 'nested', 'b.txt'), 'world!')

    const usage = await getFolderUsage('root', root)

    expect(usage.exists).toBe(true)
    expect(usage.files).toBe(2)
    expect(usage.bytes).toBe('hello'.length + 'world!'.length)
    expect(usage.truncated).toBe(false)
    expect(usage.error).toBeUndefined()
  })

  it('counts a symlink but does not follow it', async () => {
    const root = makeTempDir()
    fs.writeFileSync(path.join(root, 'real.txt'), '12345')
    // A link back to its own parent would loop forever if it were traversed.
    fs.symlinkSync(root, path.join(root, 'loop'))

    const usage = await getFolderUsage('root', root)

    expect(usage.files).toBe(1)
    expect(usage.bytes).toBe(5)
  })

  it('reports a missing folder rather than throwing', async () => {
    const usage = await getFolderUsage(
      'missing',
      path.join(os.tmpdir(), 'sasjs-does-not-exist-12345')
    )

    expect(usage.exists).toBe(false)
    expect(usage.error).toBe('not found')
    expect(usage.bytes).toBe(0)
  })

  it('reports an unconfigured folder', async () => {
    const usage = await getFolderUsage('none', undefined)

    expect(usage.exists).toBe(false)
    expect(usage.error).toBe('not configured')
  })
})

describe('getFilesystemUsage', () => {
  it('reports totals for a real filesystem', async () => {
    const usage = await getFilesystemUsage(os.tmpdir())

    expect(usage).not.toBeNull()
    expect(usage!.totalBytes).toBeGreaterThan(0)
    expect(usage!.freeBytes).toBeGreaterThanOrEqual(0)
    expect(usage!.usedPercent).toBeGreaterThanOrEqual(0)
  })

  it('answers null when there is no folder to measure', async () => {
    expect(await getFilesystemUsage(undefined)).toBeNull()
  })
})

describe('getProcessMetrics', () => {
  it('reports the running process', () => {
    const metrics = getProcessMetrics()

    expect(metrics.pid).toBe(process.pid)
    expect(metrics.nodeVersion).toBe(process.version)
    expect(metrics.cpuCount).toBeGreaterThan(0)
    expect(metrics.uptimeSeconds).toBeGreaterThanOrEqual(0)
    expect(metrics.startedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })
})

describe('log files', () => {
  let logFolder: string
  let previousLogsLoc: string

  beforeEach(() => {
    logFolder = makeTempDir()
    previousLogsLoc = process.logsLoc
    process.logsLoc = logFolder

    fs.writeFileSync(path.join(logFolder, '20260101000000.log'), 'old\n')
    fs.writeFileSync(path.join(logFolder, '20260102000000.log'), 'new\n')
    fs.writeFileSync(path.join(logFolder, 'notes.txt'), 'not a log\n')
    fs.utimesSync(
      path.join(logFolder, '20260101000000.log'),
      new Date('2026-01-01T00:00:00Z'),
      new Date('2026-01-01T00:00:00Z')
    )
    fs.utimesSync(
      path.join(logFolder, '20260102000000.log'),
      new Date('2026-01-02T00:00:00Z'),
      new Date('2026-01-02T00:00:00Z')
    )
  })

  afterEach(() => {
    process.logsLoc = previousLogsLoc
  })

  it('lists only .log files, newest first', async () => {
    const files = await listLogFiles()

    expect(files.map((file) => file.name)).toEqual([
      '20260102000000.log',
      '20260101000000.log'
    ])
  })

  it('summarises the log folder', async () => {
    const summary = await getLogFolderSummary()

    expect(summary.folder).toBe(logFolder)
    expect(summary.fileCount).toBe(2)
    expect(summary.newestFile).toBe('20260102000000.log')
    expect(summary.totalBytes).toBe('old\n'.length + 'new\n'.length)
  })

  it('answers an empty list when the folder cannot be read', async () => {
    process.logsLoc = path.join(os.tmpdir(), 'sasjs-no-logs-12345')

    expect(await listLogFiles()).toEqual([])
  })

  describe('resolveLogFile', () => {
    it('accepts a bare log name inside the folder', async () => {
      const resolved = await resolveLogFile('20260101000000.log')

      expect(resolved).toBe(
        await fs.promises.realpath(path.join(logFolder, '20260101000000.log'))
      )
    })

    it.each([
      '../secrets.log',
      '../../etc/passwd.log',
      '/etc/passwd.log',
      'sub/dir/a.log',
      'notes.txt',
      'a.log\0'
    ])('refuses %s', async (name) => {
      await expect(resolveLogFile(name)).rejects.toMatchObject({ code: 400 })
    })

    it('refuses a symlink that points outside the log folder', async () => {
      const outside = path.join(os.tmpdir(), `sasjs-outside-${Date.now()}.log`)
      fs.writeFileSync(outside, 'secret\n')
      fs.symlinkSync(outside, path.join(logFolder, 'linked.log'))

      // A lexical containment check passes this name; only resolving the real
      // path (or refusing the link) keeps the read inside the folder.
      await expect(resolveLogFile('linked.log')).rejects.toMatchObject({
        code: 400
      })
    })

    it('answers 404 for a name that is simply not there', async () => {
      await expect(resolveLogFile('20200101000000.log')).rejects.toMatchObject({
        code: 404
      })
    })

    it('refuses everything when no log folder is configured', async () => {
      process.logsLoc = undefined as any

      await expect(resolveLogFile('a.log')).rejects.toMatchObject({ code: 400 })
    })
  })

  describe('readLogTail', () => {
    it('returns the last N lines', async () => {
      const file = 'tail.log'
      writeLines(path.join(logFolder, file), 500)

      const tail = await readLogTail(file, 10)
      const returned = tail.content.split('\n')

      expect(returned).toHaveLength(10)
      expect(returned[returned.length - 1]).toBe('line 500')
      expect(tail.truncated).toBe(true)
      expect(tail.lines).toBe(10)
    })

    it('returns the whole file when it is shorter than the window', async () => {
      const file = 'small.log'
      writeLines(path.join(logFolder, file), 3)

      const tail = await readLogTail(file, 100)

      expect(tail.content.split('\n')).toEqual(['line 1', 'line 2', 'line 3'])
      expect(tail.truncated).toBe(false)
      // The count describes the answer, not the request: 3 lines, not 100.
      expect(tail.lines).toBe(3)
    })

    it('falls back to the default and caps the maximum', async () => {
      const file = 'caps.log'
      writeLines(path.join(logFolder, file), 6000)

      const defaulted = await readLogTail(file, 0)
      expect(defaulted.lines).toBe(DEFAULT_LOG_LINES)

      const capped = await readLogTail(file, 999999)
      expect(capped.lines).toBe(MAX_LOG_LINES)
    })

    it('answers 404 for a log that is not there', async () => {
      await expect(readLogTail('20200101000000.log')).rejects.toMatchObject({
        code: 404
      })
    })
  })
})
