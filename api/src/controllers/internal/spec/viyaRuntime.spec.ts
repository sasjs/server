import path from 'path'
import os from 'os'
import {
  createFile,
  deleteFolder,
  generateTimestamp,
  readFile
} from '@sasjs/utils'
import { processProgram } from '../processProgram'
import { createViyaSASProgram } from '../createViyaSASProgram'
import * as viyaClient from '../viyaClient'
import { Session, SessionState, PreProgramVars } from '../../../types'
import {
  RunTimeType,
  getSessionsFolder,
  generateUniqueFileName
} from '../../../utils'

jest.mock('../viyaClient', () => ({
  executeViyaProgram: jest.fn(),
  resetViyaAuth: jest.fn()
}))

const mockedExecuteViyaProgram = viyaClient.executeViyaProgram as jest.Mock

const preProgramVariables: PreProgramVars = {
  username: 'testUser',
  userId: '1',
  displayName: 'Test User',
  serverUrl: 'http://localhost:5000',
  httpHeaders: []
}

const makeSession = (): Session => {
  const sessionId = generateUniqueFileName(generateTimestamp())
  const creationTimeStamp = sessionId.split('-').pop() as string

  return {
    id: sessionId,
    state: SessionState.running,
    creationTimeStamp,
    deathTimeStamp: (
      parseInt(creationTimeStamp) +
      15 * 60 * 1000 -
      1000
    ).toString(),
    path: path.join(getSessionsFolder(), sessionId)
  }
}

describe('createViyaSASProgram', () => {
  it('does not inject local paths - Viya has no shared filesystem', async () => {
    const program = await createViyaSASProgram(
      '%mv_webout(OPEN)',
      preProgramVariables,
      { myvar: 'myvalue' },
      { userAutoExec: 'options nosource;' }
    )

    // The local SAS preamble defines a _webout fileref pointing at the server's
    // session folder; on Viya that path does not exist and _webout belongs to
    // the compute session, so neither the fileref nor SASAUTOS may appear.
    expect(program).not.toContain('filename _webout')
    expect(program).not.toContain('SASAUTOS')
    expect(program).not.toContain('_sasjs_webout_headers')

    // the caller's program, its variables and autoexec still arrive
    expect(program).toContain('%mv_webout(OPEN)')
    expect(program).toContain('%let myvar=%nrstr(myvalue);')
    expect(program).toContain('options nosource;')
    expect(program).toContain('%let _sasjs_username=%nrstr(testUser);')
  })
})

describe('processProgram (sasviya runtime)', () => {
  let session: Session
  let logPath: string
  let weboutPath: string
  let headersPath: string
  let tokenFile: string

  beforeAll(() => {
    const root = path.join(
      os.tmpdir(),
      `sasjs-viya-runtime-spec-${generateTimestamp()}`
    )
    process.sasjsRoot = root
    process.driveLoc = path.join(root, 'drive')
    // the failure branch logs through process.logger, which the app sets up at
    // startup but a unit spec does not.
    process.logger = {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      log: jest.fn()
    } as any
  })

  beforeEach(async () => {
    session = makeSession()
    logPath = path.join(session.path, 'log.log')
    weboutPath = path.join(session.path, 'webout.txt')
    headersPath = path.join(session.path, 'stpsrv_header.txt')
    tokenFile = path.join(session.path, 'reqHeaders.txt')
    await createFile(weboutPath, '')
    mockedExecuteViyaProgram.mockReset()
  })

  afterEach(async () => {
    await deleteFolder(session.path)
  })

  const run = () =>
    processProgram(
      '%mv_webout(OPEN)',
      preProgramVariables,
      {},
      session,
      weboutPath,
      headersPath,
      tokenFile,
      RunTimeType.SASVIYA,
      logPath
    )

  it('relays the webout and the log from Viya into the session folder', async () => {
    mockedExecuteViyaProgram.mockResolvedValue({
      webout: '{"spike":[{"X":42}]}',
      log: 'NOTE: SPIKE-OK'
    })

    await expect(run()).resolves.toBeUndefined()

    expect(await readFile(weboutPath)).toEqual('{"spike":[{"X":42}]}')
    expect(await readFile(logPath)).toEqual('NOTE: SPIKE-OK')

    // The session is left running for Execution.ts to mark completed, matching
    // how the JS/PY/R branches behave.
    expect(session.state).toEqual(SessionState.running)
    expect(session.failureReason).toBeUndefined()

    // The program submitted to Viya is the Viya preamble, not the local one.
    const submitted = mockedExecuteViyaProgram.mock.calls[0][0]
    expect(submitted).toContain('%mv_webout(OPEN)')
    expect(submitted).not.toContain('filename _webout')
  })

  it('records a Viya failure as a failed session without throwing', async () => {
    mockedExecuteViyaProgram.mockRejectedValue(
      new Error('Error: Job execution failed\nERROR: something broke')
    )

    // A failed run is a normal outcome of running arbitrary code, so
    // processProgram must resolve - Execution.ts folds failureReason into the
    // response rather than the request failing.
    await expect(run()).resolves.toBeUndefined()

    expect(session.state).toEqual(SessionState.failed)
    expect(session.failureReason).toContain('Job execution failed')
    expect(await readFile(logPath)).toContain('ERROR: something broke')
  })
})
