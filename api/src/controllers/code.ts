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
   * Code of program
   * @example "* Code HERE;"
   */
  code: string
  /**
   * runtime for program
   * @example "js"
   */
  runTime: RunTimeType
}

interface TriggerCodePayload {
  /**
   * Code of program
   * @example "* Code HERE;"
   */
  code: string
  /**
   * runtime for program
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
   * Session ID (SAS WORK folder) used to execute code.
   * This session ID should be used to poll job status.
   * @example "{ sessionId: '20241028074744-54132-1730101664824' }"
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
   * @summary Trigger Code and Return Session Id not awaiting for the job completion
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
): Promise<{ sessionId: string }> => {
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
