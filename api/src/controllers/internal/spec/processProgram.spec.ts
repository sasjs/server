import path from 'path'
import os from 'os'
import { createFile, deleteFolder, generateTimestamp } from '@sasjs/utils'
import { processProgram } from '../processProgram'
import { Session, SessionState, PreProgramVars } from '../../../types'
import {
  RunTimeType,
  getSessionsFolder,
  generateUniqueFileName
} from '../../../utils'

const preProgramVariables: PreProgramVars = {
  username: 'testUser',
  userId: '1',
  displayName: 'Test User',
  serverUrl: 'http://localhost:5000',
  httpHeaders: []
}

const makeSession = (): Session => {
  const sessionId = generateUniqueFileName(generateTimestamp())
  const sessionFolder = path.join(getSessionsFolder(), sessionId)
  const creationTimeStamp = sessionId.split('-').pop() as string
  const deathTimeStamp = (
    parseInt(creationTimeStamp) +
    15 * 60 * 1000 -
    1000
  ).toString()

  return {
    id: sessionId,
    state: SessionState.running,
    creationTimeStamp,
    deathTimeStamp,
    path: sessionFolder
  }
}

describe('processProgram (SAS runtime)', () => {
  let session: Session
  let logPath: string
  let weboutPath: string
  let headersPath: string
  let tokenFile: string

  beforeAll(() => {
    const root = path.join(
      os.tmpdir(),
      `sasjs-processProgram-spec-${generateTimestamp()}`
    )
    process.sasjsRoot = root
    process.driveLoc = path.join(root, 'drive')
  })

  beforeEach(async () => {
    session = makeSession()
    logPath = path.join(session.path, 'log.log')
    weboutPath = path.join(session.path, 'webout.txt')
    headersPath = path.join(session.path, 'stpsrv_header.txt')
    tokenFile = path.join(session.path, 'reqHeaders.txt')
    await createFile(weboutPath, '')
  })

  afterEach(async () => {
    await deleteFolder(session.path)
  })

  it('rejects instead of hanging when the session fails (e.g. %abort;)', async () => {
    setTimeout(() => {
      session.state = SessionState.failed
      session.failureReason =
        'ERROR: SAS session terminated. See log for details.'
    }, 100)

    await expect(
      processProgram(
        '%abort;',
        preProgramVariables,
        {},
        session,
        weboutPath,
        headersPath,
        tokenFile,
        RunTimeType.SAS,
        logPath
      )
    ).rejects.toThrow(/SAS session terminated/)
  }, 3000)

  it('resolves without throwing when the session completes normally', async () => {
    setTimeout(() => {
      session.state = SessionState.completed
    }, 100)

    await expect(
      processProgram(
        '%put hello world;',
        preProgramVariables,
        {},
        session,
        weboutPath,
        headersPath,
        tokenFile,
        RunTimeType.SAS,
        logPath
      )
    ).resolves.toBeUndefined()
  }, 3000)
})
