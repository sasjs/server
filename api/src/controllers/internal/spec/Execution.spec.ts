import path from 'path'
import os from 'os'
import { createFile, deleteFolder, generateTimestamp } from '@sasjs/utils'
import * as ProcessProgramModule from '../processProgram'
import { ExecutionController } from '../Execution'
import { Session, SessionState, PreProgramVars } from '../../../types'
import { RunTimeType } from '../../../utils'

const preProgramVariables: PreProgramVars = {
  username: 'testUser',
  userId: '1',
  displayName: 'Test User',
  serverUrl: 'http://localhost:5000',
  localServerUrl: 'http://127.0.0.1:5000',
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
      path: path.join(os.tmpdir(), sessionId),
      owner: 'testUser'
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

  // A service that streams with webout() and stops before CLOSE leaves a JSON
  // prefix on the drive. Served as it is, the caller's parse fails and an app
  // reports its own error instead of the refusal the service wrote - and both
  // endings produce that body: a throw (a non-zero interpreter exit) and an
  // early return, which reports no error at all.
  describe('streamed webout left open', () => {
    const openEnvelope =
      '{"SYSDATE":"24NOV26","SYSTIME":"22:44","sasjsAbort":[{"MSG":"not authorised"}]'

    const runWithWebout = async (body: string, failure?: string) => {
      jest
        .spyOn(ProcessProgramModule, 'processProgram')
        .mockImplementation(
          async (
            _program,
            _preProgramVariables,
            _vars,
            _session,
            weboutPath
          ) => {
            await createFile(weboutPath, body)
            if (failure) {
              session.state = SessionState.failed
              session.failureReason = failure
            } else {
              session.state = SessionState.completed
            }
          }
        )

      return new ExecutionController().executeProgram({
        program: 'webout()',
        preProgramVariables,
        vars: {},
        session,
        runTime: RunTimeType.JS
      })
    }

    it('serves the closed envelope of a run that failed', async () => {
      const { result } = await runWithWebout(
        openEnvelope,
        'Error: not authorised'
      )

      // the log is framed after the webout, so the body is read from its head
      const body = JSON.parse(String(result).split('\n')[0])
      expect(body.sasjsAbort[0].MSG).toBe('not authorised')
    })

    it('serves the closed envelope of a run that returned early', async () => {
      const { result } = await runWithWebout(openEnvelope)

      expect(JSON.parse(result as string).sasjsAbort[0].MSG).toBe(
        'not authorised'
      )
    })

    it('serves a complete body unchanged', async () => {
      const complete = `${openEnvelope}}`
      const { result } = await runWithWebout(complete)

      expect(result).toBe(complete)
    })

    it('names a body cut mid-member in the session log', async () => {
      // no brace makes a half-written member readable, so the body is served as
      // found and the log - the only place the caller can learn it - says why
      const cut = '{"SYSDATE":"24NOV26","SYSTIME":"22:44","users":['
      const { result, log } = await runWithWebout(cut)

      expect(result).toBe(cut)
      expect(log).toContain('the response envelope is truncated')
    })
  })

  // A failed SAS session (e.g. from %abort;) is a normal outcome of
  // running arbitrary user code, not a request-shape/server problem - the
  // same way a plain SAS ERROR: in the log (without %abort;) already
  // returns 200 with the log embedded. This mirrors the JS/PY/R failure
  // path above: resolve normally, don't throw, and let the existing
  // session.failureReason check below produce the same result shape as a
  // successful run.
  describe('SAS failure path', () => {
    it('returns the complete log embedded in a normal result instead of throwing, when the session fails', async () => {
      const logPath = path.join(session.path, 'log.log')
      const logContent =
        'NOTE: SAS session\nERROR: SAS session terminated. See log for details.\n'

      await createFile(logPath, logContent)

      jest
        .spyOn(ProcessProgramModule, 'processProgram')
        .mockImplementation(async () => {
          // mirrors the real SAS branch after the fix: sets
          // state/failureReason and resolves, exactly like the JS/PY/R
          // branch already does - it does not throw
          session.state = SessionState.failed
          session.failureReason =
            'ERROR: SAS session terminated. See log for details.'
        })

      const controller = new ExecutionController()

      const { result } = await controller.executeProgram({
        program: '%abort;',
        preProgramVariables,
        vars: {},
        session,
        runTime: RunTimeType.SAS
      })

      expect(session.state).toBe(SessionState.failed)
      expect(result).toEqual(expect.stringContaining(logContent))
    })
  })
})
