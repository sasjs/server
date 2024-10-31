import express from 'express'
import { Request, Security, Route, Tags, Post, Body } from 'tsoa'
import { ExecutionController, getSessionController } from './internal'
import {
  getPreProgramVariables,
  getUserAutoExec,
  ModeType,
  RunTimeType
} from '../utils'

interface ExecuteCodePayload {
  /**
   * The code to be executed
   * @example "* Your Code HERE;"
   */
  code: string
  /**
   * The runtime for the code - eg SAS, JS, PY or R
   * @example "js"
   */
  runTime: RunTimeType
}

interface TriggerCodePayload {
  /**
   * The code to be executed
   * @example "* Your Code HERE;"
   */
  code: string
  /**
   * The runtime for the code - eg SAS, JS, PY or R
   * @example "sas"
   */
  runTime: RunTimeType
  /**
   * Amount of minutes after the completion of the job when the session must be
   * destroyed.
   * @example 15
   */
  expiresAfterMins?: number
}

interface TriggerCodeResponse {
  /**
   * sessionId is the ID of the session and the name of the temporary folder
   * used to store code outputs.<br>
   * For SAS, this would be the SASWORK folder.<br>
   * sessionId can be used to poll session state using
   * GET /SASjsApi/session/{sessionId}/state endpoint.
   * @example "20241028074744-54132-1730101664824"
   */
  sessionId: string
}

@Security('bearerAuth')
@Route('SASjsApi/code')
@Tags('Code')
export class CodeController {
  /**
   * Execute Code on the Specified Runtime
   * @summary Run Code and Return Webout Content, Log and Print output
   * The order of returned parts of the payload is:
   * 1. Webout (if present)
   * 2. Logs UUID (used as separator)
   * 3. Log
   * 4. Logs UUID (used as separator)
   * 5. Print (if present and if the runtime is SAS)
   * Please see @sasjs/server/api/src/controllers/internal/Execution.ts for more information
   */
  @Post('/execute')
  public async executeCode(
    @Request() request: express.Request,
    @Body() body: ExecuteCodePayload
  ): Promise<string | Buffer> {
    return executeCode(request, body)
  }

  /**
   * Trigger Code on the Specified Runtime
   * @summary Triggers code and returns SessionId immediately - does not wait for job completion
   */
  @Post('/trigger')
  public async triggerCode(
    @Request() request: express.Request,
    @Body() body: TriggerCodePayload
  ): Promise<TriggerCodeResponse> {
    return triggerCode(request, body)
  }
}

const executeCode = async (
  req: express.Request,
  { code, runTime }: ExecuteCodePayload
) => {
  const { user } = req
  const userAutoExec =
    process.env.MODE === ModeType.Server
      ? user?.autoExec
      : await getUserAutoExec()

  try {
    const { result } = await new ExecutionController().executeProgram({
      program: code,
      preProgramVariables: getPreProgramVariables(req),
      vars: { ...req.query, _debug: 131 },
      otherArgs: { userAutoExec },
      runTime: runTime,
      includePrintOutput: true
    })

    return result
  } catch (err: any) {
    throw {
      code: 400,
      status: 'failure',
      message: 'Job execution failed.',
      error: typeof err === 'object' ? err.toString() : err
    }
  }
}

const triggerCode = async (
  req: express.Request,
  { code, runTime, expiresAfterMins }: TriggerCodePayload
): Promise<TriggerCodeResponse> => {
  const { user } = req
  const userAutoExec =
    process.env.MODE === ModeType.Server
      ? user?.autoExec
      : await getUserAutoExec()

  // get session controller based on runTime
  const sessionController = getSessionController(runTime)

  // get session
  const session = await sessionController.getSession()

  // add expiresAfterMins to session if provided
  if (expiresAfterMins) {
    // expiresAfterMins.used is set initially to false
    session.expiresAfterMins = { mins: expiresAfterMins, used: false }
  }

  try {
    // call executeProgram method of ExecutionController without awaiting
    new ExecutionController().executeProgram({
      program: code,
      preProgramVariables: getPreProgramVariables(req),
      vars: { ...req.query, _debug: 131 },
      otherArgs: { userAutoExec },
      runTime: runTime,
      includePrintOutput: true,
      session // session is provided
    })

    // return session id
    return { sessionId: session.id }
  } catch (err: any) {
    throw {
      code: 400,
      status: 'failure',
      message: 'Job execution failed.',
      error: typeof err === 'object' ? err.toString() : err
    }
  }
}
