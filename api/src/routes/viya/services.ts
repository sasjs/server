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
import type { Services } from '@sasjs/api'
import { createDriveService } from '@sasjs/api'

import { ExecutionController } from '../../controllers/internal'
import { nodeDriveStore } from '../../controllers/internal/nodeDriveStore'
import { desktopIdentity } from '../../utils/desktopIdentity'
import { getPreProgramVariables, RunTimeType } from '../../utils'

/** The one drive the server serves, whichever API is asked for it. */
let drive: ReturnType<typeof createDriveService> | undefined

export const serverDrive = () =>
  (drive ??= createDriveService(nodeDriveStore()))

/** Whether the emulated estate answers on this server at all. */
export const isViyaEmulationEnabled = (): boolean =>
  /^(1|true|yes|on)$/i.test(process.env.EMULATE_VIYA ?? '')

/** The address clients reach this server at, which is the estate's seed. */
const serverUrl = (req: Request): string =>
  process.env.API_SERVER_URL ??
  `${req.protocol}://${req.get('host') ?? 'localhost'}`

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
    authenticate: async () =>
      req.user ? { userId: req.user.username } : undefined
  })

export const viyaServices = (req: Request): Services => ({
  drive: serverDrive(),
  identity: identityFor(req),
  viya: {
    serverUrl: serverUrl(req),
    execute: async ({ program, variables, name }) => {
      const controller = new ExecutionController()

      const { result, log, failureReason } = await controller.executeProgram({
        program: Array.isArray(program) ? program.join('\n') : program,
        runTime: RunTimeType.SAS,
        vars: (variables ?? {}) as Record<string, string | number>,
        // every field a generated program reads, from the request: a service that
        // cannot see its own `_sasjs_userid` or the API's address cannot call back
        preProgramVariables: getPreProgramVariables(req)
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
    }
  }
})
