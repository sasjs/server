import path from 'path'
import os from 'os'
import { createFile, deleteFolder, generateTimestamp } from '@sasjs/utils'
import * as ProcessProgramModule from '../processProgram'
import { ExecutionController, SessionExecutionError } from '../Execution'
import { Session, SessionState, PreProgramVars } from '../../../types'
import { RunTimeType } from '../../../utils'

const preProgramVariables: PreProgramVars = {
  username: 'testUser',
  userId: 1,
  displayName: 'Test User',
  serverUrl: 'http://localhost:5000',
  httpHeaders: []
}

describe('ExecutionController.executeProgram (SAS failure path)', () => {
  let session: Session

  beforeEach(() => {
    const sessionId = `test-session-${generateTimestamp()}`
    session = {
      id: sessionId,
      state: SessionState.pending,
      creationTimeStamp: '0',
      deathTimeStamp: '0',
      path: path.join(os.tmpdir(), sessionId)
    }
  })

  afterEach(async () => {
    jest.restoreAllMocks()
    await deleteFolder(session.path)
  })

  it('throws a SessionExecutionError carrying the complete log when the session fails', async () => {
    const logPath = path.join(session.path, 'log.log')
    const logContent =
      'NOTE: SAS session\nERROR: SAS session terminated. See log for details.\n'

    await createFile(logPath, logContent)

    jest
      .spyOn(ProcessProgramModule, 'processProgram')
      .mockImplementation(async () => {
        throw new Error('ERROR: SAS session terminated. See log for details.')
      })

    const controller = new ExecutionController()

    const resultPromise = controller.executeProgram({
      program: '%abort;',
      preProgramVariables,
      vars: {},
      session,
      runTime: RunTimeType.SAS
    })

    await expect(resultPromise).rejects.toBeInstanceOf(SessionExecutionError)
    await expect(resultPromise).rejects.toMatchObject({
      log: logContent,
      message: expect.stringContaining('SAS session terminated')
    })
  })
})
