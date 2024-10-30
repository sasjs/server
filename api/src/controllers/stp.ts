import express from 'express'
import { Request, Security, Route, Tags, Post, Body, Get, Query } from 'tsoa'
import {
  ExecutionController,
  ExecutionVars,
  getSessionController
} from './internal'
import {
  getPreProgramVariables,
  makeFilesNamesMap,
  getRunTimeAndFilePath
} from '../utils'
import { MulterFile } from '../types/Upload'

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

interface TriggerProgramResponse {
  /**
   * The SessionId is the name of the temporary folder used to store the outputs.
   * For SAS, this would be the SASWORK folder. Can be used to poll program status.
   * This session ID should be used to poll program status.
   * @example "{ sessionId: '20241028074744-54132-1730101664824' }"
   */
  sessionId: string
}

@Security('bearerAuth')
@Route('SASjsApi/stp')
@Tags('STP')
export class STPController {
  /**
   * Trigger a Stored Program using the _program URL parameter.
   *
   * Accepts additional URL parameters (converted to session variables)
   * and file uploads.  For more details, see docs:
   *
   * https://server.sasjs.io/storedprograms
   *
   * @summary Execute a Stored Program, returns _webout and (optionally) log.
   * @param _program Location of Stored Program in SASjs Drive.
   * @param _debug Optional query param for setting debug mode (returns the session log in the response body).
   * @example _program "/Projects/myApp/some/program"
   * @example _debug 131
   */
  @Get('/execute')
  public async executeGetRequest(
    @Request() request: express.Request,
    @Query() _program: string,
    @Query() _debug?: number
  ): Promise<string | Buffer> {
    let vars = request.query as ExecutionVars
    if (_debug) {
      vars = {
        ...vars,
        _debug
      }
    }

    return execute(request, _program, vars)
  }

  /**
   * Trigger a Stored Program using the _program URL parameter.
   *
   * Accepts URL parameters and file uploads.  For more details, see docs:
   *
   * https://server.sasjs.io/storedprograms
   *
   *
   * @summary Execute a Stored Program, returns _webout and (optionally) log.
   * @param _program Location of code in SASjs Drive
   * @example _program "/Projects/myApp/some/program"
   */
  @Post('/execute')
  public async executePostRequest(
    @Request() request: express.Request,
    @Body() body?: ExecutePostRequestPayload,
    @Query() _program?: string
  ): Promise<string | Buffer> {
    const program = _program ?? body?._program
    const vars = { ...request.query, ...request.body }
    const filesNamesMap = request.files?.length
      ? makeFilesNamesMap(request.files as MulterFile[])
      : null
    const otherArgs = { filesNamesMap: filesNamesMap }

    return execute(request, program!, vars, otherArgs)
  }

  /**
   * Trigger Program on the Specified Runtime.
   * @summary Triggers program and returns SessionId immediately - does not wait for program completion.
   * @param _program Location of code in SASjs Drive.
   * @param expiresAfterMins Optional query param for setting amount of minutes after the completion of the program when the session must be destroyed.
   * @param _debug Optional query param for setting debug mode.
   * @example _program "/Projects/myApp/some/program"
   * @example _debug 131
   * @example expiresAfterMins 15
   */
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

    const { result, httpHeaders } = await new ExecutionController().executeFile(
      {
        programPath: codePath,
        runTime,
        preProgramVariables: getPreProgramVariables(req),
        vars,
        otherArgs,
        session: req.sasjsSession
      }
    )

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
    // put _program query param into vars object
    const vars: { [key: string]: string | number } = { _program }

    // if present add _debug query param to vars object
    if (_debug) {
      vars._debug = _debug
    }

    // get code path and runTime
    const { codePath, runTime } = await getRunTimeAndFilePath(_program)

    // get session controller based on runTime
    const sessionController = getSessionController(runTime)

    // get session
    const session = await sessionController.getSession()

    // add expiresAfterMins to session if provided
    if (expiresAfterMins) {
      // expiresAfterMins.used is set initially to false
      session.expiresAfterMins = { mins: expiresAfterMins, used: false }
    }

    // call executeFile method of ExecutionController without awaiting
    new ExecutionController().executeFile({
      programPath: codePath,
      runTime,
      preProgramVariables: getPreProgramVariables(req),
      vars,
      session
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
