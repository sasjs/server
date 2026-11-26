import express from 'express'
import { readFile } from '@sasjs/utils'
import {
  Request,
  Security,
  Route,
  Tags,
  Post,
  Body,
  Get,
  Query,
  Response
} from 'tsoa'
import {
  ExecutionController,
  ExecutionVars,
  getSessionController
} from './internal'
import {
  getPreProgramVariables,
  makeFilesNamesMap,
  getRunTimeAndFilePath,
  parseDebugValue,
  waitForSessionPid,
  RunTimeType
} from '../utils'
import { debugPage, saveDebugWebout } from '../routes/viya/webJobDebug'
import { MulterFile } from '../types/Upload'
import { TriggerResponse } from '../types'
import {
  mergeTierPostVariables,
  tierProgramRequest,
  viyaWebJobRequest
} from '../utils/tierPostVariables'

/**
 * Response of `POST /SASjsApi/stp/trigger`. The shape and its documentation
 * live in TriggerResponse; the name is kept because generated clients are
 * built from it.
 */
export interface TriggerProgramResponse extends TriggerResponse {}

interface ExecutePostRequestPayload {
  /**
   * Location of SAS program
   * @example "/Public/somefolder/some.file"
   */
  _program?: string
}

interface TriggerProgramPayload {
  /**
   * Location of SAS program.
   * @example "/Public/somefolder/some.file"
   */
  _program: string
  /**
   * Amount of minutes after the completion of the program when the session must be
   * destroyed.
   * @example 15
   */
  expiresAfterMins?: number
  /**
   * Query param for setting debug mode.
   */
  _debug?: number
}

@Security('bearerAuth')
@Route('SASjsApi/stp')
@Tags('STP')
export class STPController {
  /**
   * Executes a stored program and returns its `_webout` content.
   *
   * The program is identified by the `_program` query parameter. Any other query
   * parameter is passed to the program as a session variable, and files may be
   * uploaded as form fields. When `_debug` is set, the session log is appended
   * to the response body. See https://server.sasjs.io/storedprograms.
   *
   * @summary Execute a stored program
   * @param _program Location of Stored Program in SASjs Drive.
   * @param _debug Optional query param for setting debug mode (returns the session log in the response body).
   * @example _program "/Projects/myApp/some/program"
   * @example _debug 131
   */
  // no body on this one: the 400 is the query schema ("_program" is required,
  // "_debug" must be a number) or a failure while running, never a payload
  @Response(
    400,
    'Invalid request: the query parameters are invalid, or the program could not be run'
  )
  @Response(401, 'Unauthorized')
  @Get('/execute')
  public async executeGetRequest(
    @Request() request: express.Request,
    @Query() _program: string,
    @Query() _debug?: number
  ): Promise<string | Buffer> {
    // normalised where the variables are built: every reader of ExecutionVars -
    // isDebugOn included - then sees the same number, rather than each route
    // remembering to convert
    const vars: ExecutionVars = {
      ...request.query,
      _debug: parseDebugValue(_debug ?? request.query._debug)
    }

    return execute(request, _program, vars)
  }

  /**
   * Executes a stored program and returns its `_webout` content.
   *
   * The program is identified by the `_program` query parameter or by
   * `_program` in the body. Other body fields and query parameters are passed to
   * the program as session variables, and files may be uploaded as form fields.
   * See https://server.sasjs.io/storedprograms.
   *
   * @summary Execute a stored program
   * @param _program Location of code in SASjs Drive
   * @example _program "/Projects/myApp/some/program"
   */
  @Response(
    400,
    'Invalid request: the payload is invalid, or the program could not be run'
  )
  @Response(401, 'Unauthorized')
  @Post('/execute')
  public async executePostRequest(
    @Request() request: express.Request,
    @Body() body?: ExecutePostRequestPayload,
    @Query() _program?: string
  ): Promise<string | Buffer> {
    const program = _program ?? body?._program
    const isTier = Boolean((request as any)[tierProgramRequest])
    const merged = isTier
      ? mergeTierPostVariables(request.query, request.body, program)
      : { ...request.query, ...request.body }
    const vars: ExecutionVars = {
      ...merged,
      _debug: parseDebugValue(
        isTier ? merged._debug : (request.query._debug ?? request.body?._debug)
      )
    }
    const filesNamesMap = request.files?.length
      ? makeFilesNamesMap(request.files as MulterFile[])
      : null
    const otherArgs = { filesNamesMap: filesNamesMap }

    return execute(request, program!, vars, otherArgs)
  }

  /**
   * Starts a stored program and returns immediately, without waiting for it to
   * finish.
   *
   * The response carries the `sessionId` of the session running the program.
   * Poll `GET /SASjsApi/session/{sessionId}/state` for its state, or set
   * `expiresAfterMins` to have the session destroyed that many minutes after it
   * completes.
   *
   * @summary Trigger a stored program and return a session ID
   * @param _program Location of code in SASjs Drive.
   * @param expiresAfterMins Optional query param for setting amount of minutes after the completion of the program when the session must be destroyed.
   * @param _debug Optional query param for setting debug mode.
   * @example _program "/Projects/myApp/some/program"
   * @example _debug 131
   * @example expiresAfterMins 15
   */
  @Response(
    400,
    'Invalid request: the payload is invalid, or the program could not be run'
  )
  @Response(401, 'Unauthorized')
  @Post('/trigger')
  public async triggerProgram(
    @Request() request: express.Request,
    @Query() _program: string,
    @Query() _debug?: number,
    @Query() expiresAfterMins?: number
  ): Promise<TriggerProgramResponse> {
    return triggerProgram(request, { _program, _debug, expiresAfterMins })
  }
}

const execute = async (
  req: express.Request,
  _program: string,
  vars: ExecutionVars,
  otherArgs?: any
): Promise<string | Buffer> => {
  try {
    const { codePath, runTime } = await getRunTimeAndFilePath(_program)
    if ((req as any)[viyaWebJobRequest] && runTime !== RunTimeType.JS)
      throw new Error('Only local JS programs are supported by this mock.')

    const viyaDebug =
      Boolean((req as any)[viyaWebJobRequest]) && vars._debug === 131
    const { result, httpHeaders, log, failureReason } =
      await new ExecutionController().executeFile({
        programPath: codePath,
        runTime,
        preProgramVariables: getPreProgramVariables(req),
        vars,
        separateWebout: viyaDebug,
        otherArgs,
        session: req.sasjsSession
      })

    if (viyaDebug) {
      if (failureReason) throw new Error('Local JS program failed.')
      const id = saveDebugWebout(result.toString())
      if (!id) throw new Error('Debug output exceeds the local mock limit.')
      req.res?.type('html')
      return debugPage(id, log)
    }

    req.res?.header(httpHeaders)

    if (result instanceof Buffer) {
      ;(req as any).sasHeaders = httpHeaders
    }

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

const triggerProgram = async (
  req: express.Request,
  { _program, _debug, expiresAfterMins }: TriggerProgramPayload
): Promise<TriggerProgramResponse> => {
  try {
    // every query parameter becomes a session variable, as it does on the
    // synchronous execute path - a trigger that forwarded only _program and
    // _debug silently dropped the macro variables a caller passed, so a
    // scheduled job ran with none of its inputs
    const vars: ExecutionVars = {
      ...req.query,
      _program,
      _debug: parseDebugValue(_debug ?? req.query._debug)
    }

    // get code path and runTime
    const { codePath, runTime } = await getRunTimeAndFilePath(_program)

    // get session controller based on runTime
    const sessionController = getSessionController(runTime)

    // get session
    const session = await sessionController.getSession(req.user!.username)

    // add expiresAfterMins to session if provided
    if (expiresAfterMins) {
      // expiresAfterMins.used is set initially to false
      session.expiresAfterMins = { mins: expiresAfterMins, used: false }
    }

    // the spawn reports the pid, so the response needs no polling loop
    let reportSpawned: (pid: number | undefined) => void = () => undefined
    const spawned = new Promise<number | undefined>((resolve) => {
      reportSpawned = resolve
    })

    // A pre-warmed SAS pid exists before the file read. Do not acknowledge the
    // trigger until that read succeeds, and release a reservation on failure.
    let source: string
    try {
      source = await readFile(codePath)
    } catch {
      await sessionController.abandonReservation(session)
      throw new Error('Program could not be read.')
    }

    // call executeProgram method of ExecutionController without awaiting
    const program = new ExecutionController().executeProgram({
      program: source,
      runTime,
      preProgramVariables: getPreProgramVariables(req),
      vars,
      session,
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
