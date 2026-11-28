/**
 * What the emulated estate reads and writes through.
 *
 * The drive and the identity store are this server's own, so the two APIs see one
 * filesystem and one set of accounts: a file uploaded over the Viya paths appears
 * in `GET /SASjsApi/drive/file`, and the account that created it is the account
 * the server authenticated.
 *
 * Execution is this server's engine. The port hands the submitted program to
 * `ExecutionController`, which runs it exactly as a stored program is run, and
 * returns the webout the program produced and the log it wrote - so an emulated
 * estate answers with real output rather than generated output.
 */
import type { Request } from 'express'
import type { Services, Subject } from '@sasjs/api'
import { createDriveService, VIYA_TARGET_VERSION } from '@sasjs/api'

import {
  ExecutionController,
  getSessionController
} from '../../controllers/internal'
import { nodeDriveStore } from '../../controllers/internal/nodeDriveStore'
import { desktopIdentity } from '../../utils/desktopIdentity'
import { getPreProgramVariables, RunTimeType } from '../../utils'
import { localJesEnabled } from './localJes'
import { executeLocalCompute } from './localCompute'

type Execute = NonNullable<NonNullable<Services['viya']>['execute']>

/** The one drive the server serves, whichever API is asked for it. */
let drive: ReturnType<typeof createDriveService> | undefined

export const serverDrive = () =>
  (drive ??= createDriveService(nodeDriveStore()))

/**
 * How long an emulated session survives without a job.
 *
 * The estate tells a client `sessionInactiveTimeout: 3600` on every session, so
 * that is the window this server keeps one for: a shorter one would delete the
 * folder under a client that holds a session open, and its links - the job state,
 * the log - would answer nothing.
 */
const VIYA_SESSION_IDLE_MS = 60 * 60 * 1000

/** Whether the emulated estate answers on this server at all. */
export const isViyaEmulationEnabled = (): boolean =>
  /^(1|true|yes|on)$/i.test(process.env.EMULATE_VIYA ?? '')

/**
 * The one line the server prints at boot when the emulated estate is on.
 *
 * Decision 5 of sasjs/server#665 makes emulation unmistakable in three places,
 * because an answer that looks real is a support risk: the `x-sasjs-emulated`
 * header on every response (a client reads it), the settings page (a reader
 * looking for the setting finds it), and the console at startup. The third is
 * the one that catches an operator whose logs are the only evidence of which
 * mode produced a result.
 *
 * The token port is named, and named honestly: the emulator holds no account to
 * check a credential against, so `routes/viya/index.ts` answers
 * `/SASLogon/oauth/token` from this server's own accounts and registered clients.
 * Its answers are still this server standing in for Viya, so they carry the same
 * `x-sasjs-emulated` header as the rest - stamped by the mount, which is the only
 * place that can promise it on every answer including an early return.
 *
 * It answers `undefined` when the estate is off, so a host prints nothing at all
 * rather than a line announcing that a mode is not in force.
 */
export const viyaEmulationNotice = (): string | undefined =>
  isViyaEmulationEnabled()
    ? `Viya emulation is ON (EMULATE_VIYA): /identities, /folders, /files, /types, /compute and /SASLogon/oauth/token are answered as an emulated Viya ${VIYA_TARGET_VERSION}, the token port from this server's own accounts. Every answer on those paths says so in x-sasjs-emulated. This is not a Viya deployment - answers are for development and testing only, and none is authoritative for a real estate.`
    : undefined

/** The address clients reach this server at, which is the estate's seed. */
const serverUrl = (req: Request): string =>
  process.env.API_SERVER_URL ??
  `${req.protocol}://${req.get('host') ?? 'localhost'}`

/** Keep the Viya username on the wire; use the authenticated account ID for ownership. */
export const subjectOf = (req: Request): Subject | undefined =>
  req.user
    ? {
        userId: req.user.username,
        clientId: req.user.clientId,
        ownerId: req.user.userId
      }
    : undefined

/**
 * The caller, as the guard resolved them.
 *
 * `desktopIdentity` answers as the process's own OS account, which in server mode
 * is nobody the caller signed in as: the estate would report one account while
 * running as another. The emulator asks identity one question - who is this token
 * - and the guard has already answered it, so that is what this returns.
 */
const identityFor = (req: Request): Services['identity'] =>
  Object.assign({}, desktopIdentity, {
    authenticate: async () => subjectOf(req)
  })

export const viyaServices = (req: Request): Services => ({
  drive: serverDrive(),
  identity: identityFor(req),
  viya: {
    // Opt in only for the disposable desktop mock.
    ...(localJesEnabled() && {
      allowUntransactionalJobDefinitionCreation: true
    }),
    serverUrl: serverUrl(req),
    execute: (async ({
      program,
      variables,
      name: _name,
      sessionId
    }: Parameters<Execute>[0]) => {
      if (process.env.LOCAL_VIYA_SCRIPT_MOCKS !== undefined) {
        try {
          return await executeLocalCompute(
            req,
            program,
            variables as Record<string, unknown> | undefined
          )
        } catch (error) {
          // Do not let the API dispatcher format this as a synthetic SAS ERROR,
          // or expose submitted code and other unexpected exception details.
          const knownErrors = [
            'Local script mock requires a loopback desktop client.',
            'Invalid local script mock registry.',
            'Invalid local script mock code.',
            'Unregistered local script mock.'
          ]
          const message =
            error instanceof Error && knownErrors.includes(error.message)
              ? error.message
              : 'Local script mock failed.'
          return {
            state: 'failed' as const,
            log: `Mock Compute (not SAS)\n${message}`
          }
        }
      }
      if (localJesEnabled())
        return executeLocalCompute(
          req,
          program,
          variables as Record<string, unknown> | undefined
        )
      if (
        process.env.MODE === 'desktop' &&
        process.runTimes.includes(RunTimeType.JS) &&
        !process.runTimes.includes(RunTimeType.SAS)
      )
        throw new Error('Local JS mock: no registered twin.')
      const controller = new ExecutionController()

      // every field a generated program reads, from the request: a service that
      // cannot see its own `_sasjs_userid` or the API's address cannot call back
      const preProgramVariables = getPreProgramVariables(req)

      // the estate's session, not the account's: a user may hold several, and
      // that is how several jobs run at once. One folder per account would mean
      // the second run overwrites the first's `webout.txt` while it is being read
      const session = sessionId
        ? await getSessionController(RunTimeType.SAS).getSessionForId(
            sessionId,
            preProgramVariables.username,
            VIYA_SESSION_IDLE_MS
          )
        : undefined

      const { result, log, failureReason } = await controller.executeProgram({
        program: Array.isArray(program) ? program.join('\n') : program,
        runTime: RunTimeType.SAS,
        vars: (variables ?? {}) as Record<string, string | number>,
        session,
        preProgramVariables
      })

      // a failed run's `result` is the webout-and-log bundle, which is for
      // reading: the webout is left absent so a client cannot parse it as data
      const webout =
        typeof result === 'string' ? result : result.toString('utf-8')

      // the run's own log, from the controller that wrote it: a failed program
      // says so in the log, and the emulator serves this where a client reads it
      if (failureReason)
        return { webout: undefined, log, state: 'failed' as const }

      return { webout, log }
    }) satisfies Execute
  }
})
