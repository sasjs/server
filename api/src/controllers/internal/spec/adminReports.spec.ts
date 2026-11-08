import fs from 'fs'
import os from 'os'
import path from 'path'

import {
  DEFAULT_LOG_LINES,
  MAX_LOG_LINES,
  normaliseDiagnostics,
  normaliseLogFiles
} from '@sasjs/api'

import { AdminController } from '../../admin'
import { adminReports } from '../adminReports'

/**
 * The host supplies readings; the package decides everything a client keys on.
 * These cases assert the crossing: that the report this host builds is a report
 * the package's normalisers accept, and that the refusals a client sees are the
 * documented ones.
 *
 * The normalisers throw a plain `Error`, which `sendError` renders as a masked
 * `500` - so a report that loses a field would turn a diagnostics page into
 * "Internal server error" with every suite green. That is the case the injected
 * report below pins.
 */

let root: string
let logs: string

const writeLog = (name: string, content: string) =>
  fs.writeFileSync(path.join(logs, name), content)

beforeAll(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'admin-reports-'))
  logs = path.join(root, 'logs')
  fs.mkdirSync(logs)

  ;(process as any).sasjsRoot = root
  ;(process as any).driveLoc = path.join(root, 'drive')
  ;(process as any).logsLoc = logs
  ;(process as any).runTimes = []
  ;(process as any).logger = {
    info: jest.fn(),
    log: jest.fn(),
    error: jest.fn()
  }
})

afterAll(() => {
  fs.rmSync(root, { recursive: true, force: true })
})

beforeEach(() => {
  fs.rmSync(logs, { recursive: true, force: true })
  fs.mkdirSync(logs)
})

describe('GET /SASjsApi/admin/diagnostics', () => {
  it('answers a report the package accepts', async () => {
    const answer = await new AdminController().diagnostics()

    expect(() => normaliseDiagnostics(answer as any)).not.toThrow()
    expect(answer.server.pid).toBe(process.pid)
    expect(answer.server.sasjsRoot).toEqual(root)
    expect(typeof answer.memory.rssBytes).toEqual('number')
    expect(answer.logs.folder).toEqual(logs)
  })

  it('refuses a report that lost a field', async () => {
    const reports = adminReports()

    const controller = new AdminController({
      ...reports,
      diagnostics: async () => ({}) as any
    })

    await expect(controller.diagnostics()).rejects.toThrow()
  })
})

describe('GET /SASjsApi/admin/logs', () => {
  it('lists the log files, and the package accepts the listing', async () => {
    writeLog('20260101000000.log', 'first')
    writeLog('20260102000000.log', 'second')
    writeLog('not-a-log.txt', 'ignored')

    const answer = await new AdminController().logs()

    expect(answer.files.map((file) => file.name)).toEqual([
      '20260102000000.log',
      '20260101000000.log'
    ])
    expect(() => normaliseLogFiles(answer.files)).not.toThrow()
  })
})

describe('GET /SASjsApi/admin/logs/{fileName}', () => {
  it('answers the tail of a file the folder holds', async () => {
    writeLog('20260101000000.log', 'one\ntwo\nthree\n')

    const answer = await new AdminController().logTail('20260101000000.log')

    expect(answer.content).toContain('three')
    expect(answer.fileName).toEqual('20260101000000.log')
    expect(answer.lines).toEqual(3)
  })

  it('lets the package apply the default and the ceiling, not this host', async () => {
    // the port sees the decision, which is the only place the clamp is visible:
    // `LogTail.lines` reports what was returned, not what was asked for
    const logTail = jest.fn(async (fileName: string, lines: number) => ({
      fileName,
      lines,
      bytesRead: 0,
      truncated: false,
      content: ''
    }))

    const controller = new AdminController({ ...adminReports(), logTail })

    await controller.logTail('20260101000000.log')
    expect(logTail).toHaveBeenLastCalledWith(
      '20260101000000.log',
      DEFAULT_LOG_LINES
    )

    await controller.logTail('20260101000000.log', MAX_LOG_LINES * 4)
    expect(logTail).toHaveBeenLastCalledWith(
      '20260101000000.log',
      MAX_LOG_LINES
    )
  })

  it('answers 404 for a name that is not there', async () => {
    await expect(
      new AdminController().logTail('20260101000000.log')
    ).rejects.toEqual({ code: 404, message: 'Log file not found.' })
  })

  it('answers 400 for a name that could escape the folder', async () => {
    await expect(
      new AdminController().logTail('../../etc/passwd.log')
    ).rejects.toEqual({ code: 400, message: 'Invalid log file name.' })
  })
})
