import express from 'express'
import { Request, Security, Route, Tags, Post, Body, Get, Query } from 'tsoa'
import { ExecutionController, ExecutionVars } from './internal'
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

@Security('bearerAuth')
@Route('SASjsApi/stp')
@Tags('STP')
export class STPController {
  /**
   * Trigger a Stored Program using the _program URL parameter.
   *
   * Accepts URL parameters and file uploads.  For more details, see docs:
   *
   * https://server.sasjs.io/storedprograms
   *
   * @summary Execute a Stored Program, returns _webout and (optionally) log.
   * @param _program Location of code in SASjs Drive
   * @example _program "/Projects/myApp/some/program"
   */
  @Get('/execute')
  public async executeGetRequest(
    @Request() request: express.Request,
    @Query() _program: string
  ): Promise<string | Buffer> {
    const vars = request.query as ExecutionVars

    return execute(request, _program, vars, undefined, true)
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

    return execute(request, program!, vars, otherArgs, true)
  }
}

const execute = async (
  req: express.Request,
  _program: string,
  vars: ExecutionVars,
  otherArgs?: any,
  isStp?: boolean
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
        session: req.sasjsSession,
        isStp
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
