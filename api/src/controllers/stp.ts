import express from 'express'
import path from 'path'
import { Request, Security, Route, Tags, Post, Body, Get, Query } from 'tsoa'
import { ExecutionController } from './internal'
import { PreProgramVars } from '../types'
import { getTmpFilesFolderPath, makeFilesNamesMap } from '../utils'

interface ExecuteReturnJsonPayload {
  /**
   * Location of SAS program
   * @example "/Public/somefolder/some.file"
   */
  _program?: string
}
interface ExecuteReturnJsonResponse {
  status: string
  _webout: string
  log?: string
  message?: string
}

@Security('bearerAuth')
@Route('SASjsApi/stp')
@Tags('STP')
export class STPController {
  /**
   * Trigger a SAS program using it's location in the _program parameter.
   * Enable debugging using the _debug parameter.
   * Additional URL parameters are turned into SAS macro variables.
   * Any files provided are placed into the session and
   * corresponding _WEBIN_XXX variables are created.
   * @summary Execute Stored Program, return raw content
   * @query _program Location of SAS program
   * @example _program "/Public/somefolder/some.file"
   */
  @Get('/execute')
  public async executeReturnRaw(
    @Request() request: express.Request,
    @Query() _program: string
  ): Promise<string> {
    return executeReturnRaw(request, _program)
  }

  /**
   * Trigger a SAS program using it's location in the _program parameter.
   * Enable debugging using the _debug parameter.
   * Additional URL parameters are turned into SAS macro variables.
   * Any files provided are placed into the session and
   * corresponding _WEBIN_XXX variables are created.
   * @summary Execute Stored Program, return JSON
   * @query _program Location of SAS program
   * @example _program "/Public/somefolder/some.file"
   */
  @Post('/execute')
  public async executeReturnJson(
    @Request() request: express.Request,
    @Body() body?: ExecuteReturnJsonPayload,
    @Query() _program?: string
  ): Promise<ExecuteReturnJsonResponse> {
    const program = _program ?? body?._program
    return executeReturnJson(request, program!)
  }
}

const executeReturnRaw = async (
  req: express.Request,
  _program: string
): Promise<string> => {
  const query = req.query as { [key: string]: string | number | undefined }
  const sasCodePath =
    path
      .join(getTmpFilesFolderPath(), _program)
      .replace(new RegExp('/', 'g'), path.sep) + '.sas'

  try {
    const result = await new ExecutionController().executeFile(
      sasCodePath,
      getPreProgramVariables(req),
      query
    )

    return result as string
  } catch (err: any) {
    throw {
      code: 400,
      status: 'failure',
      message: 'Job execution failed.',
      error: typeof err === 'object' ? err.toString() : err
    }
  }
}

const executeReturnJson = async (
  req: any,
  _program: string
): Promise<ExecuteReturnJsonResponse> => {
  const sasCodePath =
    path
      .join(getTmpFilesFolderPath(), _program)
      .replace(new RegExp('/', 'g'), path.sep) + '.sas'

  const filesNamesMap = req.files?.length ? makeFilesNamesMap(req.files) : null

  try {
    const { webout, log } = (await new ExecutionController().executeFile(
      sasCodePath,
      getPreProgramVariables(req),
      { ...req.query, ...req.body },
      { filesNamesMap: filesNamesMap },
      true
    )) as { webout: string; log: string }
    return {
      status: 'success',
      _webout: webout,
      log
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

const getPreProgramVariables = (req: any): PreProgramVars => {
  const host = req.get('host')
  const protocol = req.protocol + '://'
  const { user, accessToken } = req
  return {
    username: user.username,
    userId: user.userId,
    displayName: user.displayName,
    serverUrl: protocol + host,
    accessToken
  }
}
