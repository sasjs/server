import express from 'express'
import {
  Request,
  Response,
  Security,
  Route,
  Tags,
  Post,
  Get,
  Body,
  Query
} from 'tsoa'
import { Diagnostic, formatText } from '@sasjs/lint'
import { getFormatEngine } from '../utils/formatEngine'
import { ExecutionController, getSessionController } from './internal'
import { LintConfigJson, TriggerResponse } from '../types'
import {
  getPreProgramVariables,
  getUserAutoExec,
  getDriveLintConfig,
  getDriveLintConfigObject,
  lintProgram,
  ModeType,
  RunTimeType,
  waitForSessionPid
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

/**
 * Response of `POST /SASjsApi/code/trigger`. The shape and its documentation
 * live in TriggerResponse; the name is kept because generated clients are
 * built from it.
 */
export interface TriggerCodeResponse extends TriggerResponse {}

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
  /**
   * Whether to run the layout engine as well as the rules. Defaults to true,
   * which is what "format" means.
   *
   * `false` is the editor's "fix lint issues": the fixes pass alone - trailing
   * spaces, line endings, the Doxygen header, the wrapping a line over the
   * length limit gets, and the removal of macro declarations a header lists but
   * the file never invokes - and an author who asks for those does not want the
   * engine's statement breaks and indentation rewritten at the same time. A
   * finding the fixes pass leaves alone is reported: a tab used for indentation,
   * or a line it cannot break. With the layout engine a tab-indented line is
   * re-indented with spaces, so that finding goes, and an over-long line is
   * split after its keyword, which can still leave it over the limit. Nothing
   * else about the response changes: it is still the rewritten buffer.
   * @example false
   */
  layout?: boolean
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
   * The log can contain the UUID itself: a program's source is echoed into its
   * log, so the literal appears wherever sasjs/core's `ms_runstp` or
   * `ms_testservice` is part of the submitted code, and a service that calls
   * another puts the nested response in it. The UUID marks the boundaries of
   * the log, not a fixed number of parts - everything between the first and the
   * last occurrence is the log.
   *
   * This endpoint waits for the program to finish. To start a program and poll
   * for its result instead, use `POST /SASjsApi/code/trigger`. See
   * https://server.sasjs.io/ for the available runtimes.
   *
   * @summary Execute code and return its output
   */
  @Response(
    400,
    'Invalid request: the payload is invalid, or the program could not be run'
  )
  @Response(401, 'Unauthorized')
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
  @Response(
    400,
    'Invalid request: the payload is invalid, or the program could not be run'
  )
  @Response(401, 'Unauthorized')
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
  @Response(
    400,
    '"code" is required / "code" must be a string / "code" is not allowed to be empty'
  )
  @Response(401, 'Unauthorized')
  @Post('/lint')
  public async lintCode(@Body() body: LintCodePayload): Promise<Diagnostic[]> {
    return lintProgram(body.code, await getDriveLintConfig(body.filePath))
  }

  /**
   * Returns the lint rules that apply to a file on the drive, as JSON.
   *
   * The Studio formats code in the browser, where the program already is; what
   * it cannot decide for itself is which `.sasjslint` wins, so this answers that
   * question with the rules rather than making the client ship the program to
   * have it formatted. The walk is the same one the lint and format routes use.
   *
   * Nothing is executed and no SAS source is returned. The payload is the
   * parsed `.sasjslint` document, including any additional settings it contains.
   *
   * @param filePath a drive-relative path as the Studio editor knows it, e.g.
   * `/projects/app/run.sas`. Omitted for an untitled buffer.
   * @summary Get the lint rules that apply to a drive path
   */
  @Response(401, 'Unauthorized')
  @Get('/lint-config')
  public async getLintConfig(
    @Query() filePath?: string
  ): Promise<LintConfigJson> {
    return getDriveLintConfigObject(filePath)
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
  @Response(
    400,
    '"code" is required / "code" must be a string / "code" is not allowed to be empty'
  )
  @Response(401, 'Unauthorized')
  @Post('/format')
  public async formatCode(@Body() body: FormatCodePayload): Promise<string> {
    const lintConfig = await getDriveLintConfig(body.filePath)

    // The fixes pass alone, for a caller that asked for the lint fixes and not
    // the layout. The engine is not loaded at all in that case, so the request
    // does not wait for a module graph it would not use.
    if (body.layout === false) return formatText(body.code, lintConfig)

    // The engine gives the formatter its layout - indentation, statement breaks,
    // keyword case from the drive's .sasjslint. It is loaded on first use, so a
    // server that never formats pays nothing for it, and a load that fails leaves
    // the fixes pass alone rather than failing the request: the header and the
    // wrapping are still worth having.
    let reprint
    try {
      reprint = await getFormatEngine()
    } catch (error) {
      reprint = undefined
    }

    return formatText(body.code, lintConfig, reprint ? { reprint } : {})
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
  const session = await sessionController.getSession(req.user!.username)

  // add expiresAfterMins to session if provided
  if (expiresAfterMins) {
    // expiresAfterMins.used is set initially to false
    session.expiresAfterMins = { mins: expiresAfterMins, used: false }
  }

  try {
    // the spawn reports the pid, so the response needs no polling loop
    let reportSpawned: (pid: number | undefined) => void = () => undefined
    const spawned = new Promise<number | undefined>((resolve) => {
      reportSpawned = resolve
    })

    // call executeProgram method of ExecutionController without awaiting
    const program = new ExecutionController().executeProgram({
      program: code,
      preProgramVariables: getPreProgramVariables(req),
      vars: { ...req.query, _debug: 131 },
      otherArgs: { userAutoExec },
      runTime: runTime,
      includePrintOutput: true,
      session, // session is provided
      onSpawn: reportSpawned
    })

    // return session id, and the pid when the runtime has a local process
    return {
      sessionId: session.id,
      pid: await waitForSessionPid(session, spawned, program, runTime)
    }
  } catch (err: any) {
    throw {
      code: 400,
      status: 'failure',
      message: 'Job execution failed.',
      error: typeof err === 'object' ? err.toString() : err
    }
  }
}
