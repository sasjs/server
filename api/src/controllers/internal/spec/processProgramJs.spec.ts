/**
 * processProgram for the JS/PY/R runtimes.
 *
 * The session's log file is how a caller sees what a stored program did, so it
 * has to hold everything the interpreter wrote. That output used to be
 * collected through an `execFile` callback as well as streamed to the log, and
 * Node buffers a callback's stdout and stderr up to a 1 MiB `maxBuffer` before
 * it kills the child - so a chatty program's log ended mid-run, roughly where
 * the megabyte fell, and the session was reported as crashed.
 *
 * The SAS and Viya runtimes are covered by processProgram.spec.ts.
 */
import { existsSync, mkdtempSync } from 'fs'
import { readFile } from 'fs/promises'
import { tmpdir } from 'os'
import path from 'path'
import { createFile, deleteFolder } from '@sasjs/utils'
import { processProgram } from '../processProgram'
import { PreProgramVars, Session, SessionState } from '../../../types'
import { RunTimeType } from '../../../utils'

const preProgramVariables: PreProgramVars = {
  username: 'testUser',
  userId: '1',
  displayName: 'Test User',
  serverUrl: 'http://localhost:5000',
  localServerUrl: 'http://127.0.0.1:5000',
  httpHeaders: []
}

/** The log is written by a stream, so its last bytes land after the promise. */
const readLogWhenItContains = async (logPath: string, marker: string) => {
  for (let attempt = 0; attempt < 100; attempt++) {
    const log = await readFile(logPath, 'utf8').catch(() => '')
    if (log.includes(marker)) return log

    await new Promise((resolve) => setTimeout(resolve, 50))
  }

  return readFile(logPath, 'utf8')
}

describe('processProgram (js runtime)', () => {
  let session: Session
  let workDir: string
  let logPath: string
  let weboutPath: string
  let headersPath: string
  let tokenFile: string

  beforeEach(async () => {
    workDir = mkdtempSync(path.join(tmpdir(), 'sasjs-process-'))

    session = {
      id: 'test-session',
      state: SessionState.pending,
      creationTimeStamp: '0',
      deathTimeStamp: '0',
      path: workDir,
      owner: 'testUser'
    }

    logPath = path.join(workDir, 'log.log')
    weboutPath = path.join(workDir, 'webout.txt')
    headersPath = path.join(workDir, 'stpsrv_header.txt')
    tokenFile = path.join(workDir, 'reqHeaders.txt')

    for (const file of [weboutPath, headersPath, tokenFile]) {
      await createFile(file, '')
    }

    ;(process as any).nodeLoc = process.execPath
    ;(process as any).logger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn()
    }
  })

  afterEach(async () => {
    await deleteFolder(workDir)
  })

  const run = (program: string) =>
    processProgram(
      program,
      preProgramVariables,
      {},
      session,
      weboutPath,
      headersPath,
      tokenFile,
      RunTimeType.JS,
      logPath
    )

  it('keeps the whole log when the program writes more than a megabyte', async () => {
    const lineCount = 3000
    const lastLine = `line ${lineCount - 1} `
    const program = `for (let i = 0; i < ${lineCount}; i++) { console.log('line ' + i + ' ' + 'x'.repeat(480)) }`

    await run(program)

    const log = await readLogWhenItContains(logPath, lastLine)

    expect(session.state).toBe(SessionState.completed)
    expect(session.failureReason).toBeUndefined()
    expect(log).toContain(lastLine)
    // More than the 1 MiB execFile buffer, so the old path would stop early.
    expect(log.length).toBeGreaterThan(1024 * 1024)
  }, 60000)

  it('reports a non-zero exit as a failed session, keeping the log', async () => {
    const program = `console.log('before the throw'); throw new Error('boom')`

    await run(program)

    const log = await readLogWhenItContains(logPath, 'boom')

    expect(session.state).toBe(SessionState.failed)
    expect(session.failureReason).toContain('Command failed')
    // The reason travels to API consumers, and execFile used to put the failed
    // command's stderr in it.
    expect(session.failureReason).toContain('boom')
    expect(log).toContain('before the throw')
  }, 60000)

  // A log that cannot be written: /dev/full is a Linux device that accepts an
  // open and answers every write with ENOSPC.
  const itOnLinux = existsSync('/dev/full') ? it : it.skip

  itOnLinux(
    'fails the session, rather than the process, when the log cannot be written',
    async () => {
      const program = `for (let i = 0; i < 5000; i++) console.log('line ' + i)`

      logPath = '/dev/full'

      await expect(run(program)).resolves.toBeUndefined()

      expect(session.state).toBe(SessionState.failed)
      expect(session.failureReason).toContain('Failed to write the session log')
    },
    60000
  )
})
