import express from 'express'
import { Request, Security, Route, Tags, Post, Body } from 'tsoa'
import { Diagnostic, formatText } from '@sasjs/lint'
import { ExecutionController, getSessionController } from './internal'
import {
  getPreProgramVariables,
  getUserAutoExec,
  getDriveLintConfig,
  lintProgram,
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
   * `sessionId` is the ID of the session and the name of the temporary folder
   * used to store code outputs.<br><br>
   * For SAS, this would be the location of the SASWORK folder.<br><br>
   * `sessionId` can be used to poll session state using the
   * GET /SASjsApi/session/{sessionId}/state endpoint.
   * @example "20241028074744-54132-1730101664824"
   */
  sessionId: string
}

interface LintCodePayload {
  /**
   * The SAS code to be linted
   * @example "data _null_;\n  x = 1;\nrun;"
   */
  code: string
  /**
   * The drive path of the file the code comes from, when it has one. The rules
   * resolve from the nearest `.sasjslint` at or above that file's folder, so
   * each folder in the drive tree can carry its own rules. Omitted for an
   * untitled buffer, which lints against the drive-root rules.
   * @example "/projects/app/run.sas"
   */
  filePath?: string
}

interface FormatCodePayload {
  /**
   * The SAS code to be formatted
   * @example "data _null_;\n  x = 1;\nrun;"
   */
  code: string
  /**
   * The drive path of the file the code comes from, when it has one. The rules
   * resolve from the nearest `.sasjslint` at or above that file's folder, so
   * each folder in the drive tree can carry its own rules. Omitted for an
   * untitled buffer, which formats against the drive-root rules.
   * @example "/projects/app/run.sas"
   */
  filePath?: string
}

@Security('bearerAuth')
@Route('SASjsApi/code')
@Tags('Code')
export class CodeController {
  /**
   * Runs the supplied code on the requested runtime and returns its output.
   *
   * The response body is assembled from the parts the program produced, joined
   * with newlines and separated by a UUID that marks the boundaries of the log:
   *
   * 1. Webout - the `_webout` content, omitted when the program writes none
   * 2. Logs UUID - the server's identifier opening the log section
   * 3. Log - the program log
   * 4. Logs UUID - the same identifier closing the log section
   * 5. Print - the SAS listing, present only for the `sas` runtime
   *
   * This endpoint waits for the program to finish. To start a program and poll
   * for its result instead, use `POST /SASjsApi/code/trigger`. See
   * https://server.sasjs.io/ for the available runtimes.
   *
   * @summary Execute code and return its output
   */
  @Post('/execute')
  public async executeCode(
    @Request() request: express.Request,
    @Body() body: ExecuteCodePayload
  ): Promise<string | Buffer> {
    return executeCode(request, body)
  }

  /**
   * Starts the supplied code on the requested runtime and returns immediately,
   * without waiting for it to finish.
   *
   * The response carries the `sessionId` of the session running the code. Poll
   * `GET /SASjsApi/session/{sessionId}/state` for its state, or set
   * `expiresAfterMins` to have the session destroyed that many minutes after it
   * completes. See https://server.sasjs.io/ for the available runtimes.
   *
   * @summary Trigger code and return a session ID
   */
  @Post('/trigger')
  public async triggerCode(
    @Request() request: express.Request,
    @Body() body: TriggerCodePayload
  ): Promise<TriggerCodeResponse> {
    return triggerCode(request, body)
  }

  /**
   * Lints the supplied SAS code and returns the diagnostics.
   *
   * The code is submitted in the request rather than named as a file, so an
   * editor can lint its buffer, including unsaved changes, and no drive
   * permission is involved. Nothing is executed.
   *
   * When the request names the file's drive path, the rules come from the
   * nearest `.sasjslint` at or above that file's folder, so each folder in
   * the drive tree can carry its own rules; a request without a path lints
   * against the drive-root rules file. Diagnostics describe the submitted
   * text only; no other file is read.
   *
   * @summary Lint SAS code and return the diagnostics
   */
  @Post('/lint')
  public async lintCode(@Body() body: LintCodePayload): Promise<Diagnostic[]> {
    return lintProgram(body.code, await getDriveLintConfig(body.filePath))
  }

  /**
   * Formats the supplied SAS code and returns the formatted text.
   *
   * The code is submitted in the request rather than named as a file, so an
   * editor can format its buffer, including unsaved changes, and no drive
   * permission is involved. Nothing is executed.
   *
   * When the request names the file's drive path, the rules come from the
   * nearest `.sasjslint` at or above that file's folder, so each folder in
   * the drive tree can carry its own rules; a request without a path formats
   * against the drive-root rules file. Formatting only rewrites the submitted
   * text; no other file is read or written.
   *
   * @summary Format SAS code and return the formatted text
   */
  @Post('/format')
  public async formatCode(@Body() body: FormatCodePayload): Promise<string> {
    return formatText(body.code, await getDriveLintConfig(body.filePath))
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
