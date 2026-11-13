/**
 * The execution port runs a job in the session the estate named.
 *
 * `@sasjs/api` hands `execute()` the Viya session the job belongs to, and this
 * server has sessions of its own. A user may hold several sessions - that is how
 * several jobs run at once - and handing every job the account's pooled session
 * gives one folder, with one `webout.txt` and one `log.log`, per ACCOUNT: two
 * sessions then overwrite each other's answer mid-run and the job state of one
 * reports the other's output.
 *
 * These cases assert the port itself, with the engine stubbed: which session the
 * controller is asked to run in is the whole question, and running SAS would
 * answer it while making the answer depend on an engine the suite does not have.
 */
import { deleteFolder, generateTimestamp } from '@sasjs/utils'
import type { Request } from 'express'
import os from 'os'
import path from 'path'

import { ExecutionController } from '../../../controllers/internal'
import * as sessions from '../../../controllers/internal/Session'
import { SessionController } from '../../../controllers/internal/Session'
import { RunTimeType } from '../../../utils'
import { viyaServices } from '../services'

const requestAs = (username: string) =>
  ({
    user: { username, userId: 'userId1', displayName: username },
    headers: {},
    cookies: {},
    protocol: 'http',
    get: () => 'localhost:5000'
  }) as unknown as Request

describe('the Viya execution port', () => {
  let root: string
  let executed: { session?: { id: string; path: string; owner: string } }[]

  beforeAll(() => {
    root = path.join(
      os.tmpdir(),
      `sasjs-viya-session-spec-${generateTimestamp()}`
    )

    process.sasjsRoot = root
    process.driveLoc = path.join(root, 'drive')
    process.runTimes = [RunTimeType.SAS]
  })

  beforeEach(() => {
    executed = []

    // a plain controller, not the SAS one: this case is about which session the
    // port runs in, and the SAS controller starts a process to build one
    jest
      .spyOn(sessions, 'getSessionController')
      .mockReturnValue(new SessionController())

    jest
      .spyOn(ExecutionController.prototype, 'executeProgram')
      .mockImplementation(async (params: any) => {
        executed.push({ session: params.session })

        return {
          result: '[]',
          log: '',
          httpHeaders: {}
        } as never
      })
  })

  afterEach(() => jest.restoreAllMocks())

  afterAll(async () => {
    await deleteFolder(root)
  })

  it('runs a job in the session the estate named', async () => {
    const services = viyaServices(requestAs('alice'))

    await services.viya!.execute!({ program: 'data a; run;', sessionId: 's1' })
    await services.viya!.execute!({ program: 'data b; run;', sessionId: 's2' })

    // two sessions, two folders: one folder per account is what let a second
    // run overwrite the first's webout while the first was being read
    expect(executed[0].session!.path).not.toEqual(executed[1].session!.path)
    expect(executed[0].session!.owner).toEqual('alice')
  })

  it('keeps one session per id, so jobs in it run in turn', async () => {
    const services = viyaServices(requestAs('alice'))

    await services.viya!.execute!({ program: 'data a; run;', sessionId: 's1' })
    await services.viya!.execute!({ program: 'data b; run;', sessionId: 's1' })

    expect(executed[0].session!.path).toEqual(executed[1].session!.path)
  })

  it('does not hand one caller the session another named', async () => {
    // the id is the caller's to choose: two accounts naming the same one are two
    // sessions, or the second reads and overwrites the first's webout
    await viyaServices(requestAs('alice')).viya!.execute!({
      program: 'data a; run;',
      sessionId: 'shared'
    })
    await viyaServices(requestAs('bob')).viya!.execute!({
      program: 'data b; run;',
      sessionId: 'shared'
    })

    expect(executed[0].session!.path).not.toEqual(executed[1].session!.path)
    expect(executed[1].session!.owner).toEqual('bob')
  })
})
