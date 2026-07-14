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

describe('ExecutionController.executeProgram', () => {
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

  // Regression coverage: for JS/PY/R, processProgram sets session.state to
  // `failed` itself (without throwing) on a non-zero interpreter exit.
  // ExecutionController.executeProgram used to unconditionally overwrite
  // that back to `completed` right after processProgram returned, silently
  // losing the failure for anything downstream that inspects session.state.
  describe('JS/PY/R failure path', () => {
    it('does not overwrite a failed session state back to completed', async () => {
      // mirrors processProgram's real JS/PY/R branch on a non-zero exit:
      // it sets state/failureReason itself and resolves - it does not throw
      jest
        .spyOn(ProcessProgramModule, 'processProgram')
        .mockImplementation(async () => {
          session.state = SessionState.failed
          session.failureReason = 'Error: process exited with code 1'
        })

      const controller = new ExecutionController()

      await controller.executeProgram({
        program: 'throw new Error("boom")',
        preProgramVariables,
        vars: {},
        session,
        runTime: RunTimeType.JS
      })

      expect(session.state).toBe(SessionState.failed)
    })

    it('still marks a genuinely successful session as completed', async () => {
      jest
        .spyOn(ProcessProgramModule, 'processProgram')
        .mockImplementation(async () => {
          session.state = SessionState.completed
        })

      const controller = new ExecutionController()

      await controller.executeProgram({
        program: 'console.log("hello")',
        preProgramVariables,
        vars: {},
        session,
        runTime: RunTimeType.JS
      })

      expect(session.state).toBe(SessionState.completed)
    })
  })

  describe('SAS failure path', () => {
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
})
