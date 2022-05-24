import express from 'express'
import { Request, Security, Route, Tags, Post, Body } from 'tsoa'
import { ExecuteReturnJson, ExecutionController } from './internal'
import { ExecuteReturnJsonResponse } from '.'
import { getPreProgramVariables, parseLogToArray } from '../utils'

interface ExecuteSASCodePayload {
  /**
   * Code of SAS program
   * @example "* SAS Code HERE;"
   */
  code: string
}

@Security('bearerAuth')
@Route('SASjsApi/code')
@Tags('CODE')
export class CodeController {
  /**
   * Execute SAS code.
   * @summary Run SAS Code and returns log
   */
  @Post('/execute')
  public async executeSASCode(
    @Request() request: express.Request,
    @Body() body: ExecuteSASCodePayload
  ): Promise<ExecuteReturnJsonResponse> {
    return executeSASCode(request, body)
  }
}

const executeSASCode = async (
  req: express.Request,
  { code }: ExecuteSASCodePayload
) => {
  const { user } = req
  try {
    const { webout, log, httpHeaders } =
      (await new ExecutionController().executeProgram(
        code,
        getPreProgramVariables(req),
        { ...req.query, _debug: 131 },
        { userAutoExec: user?.autoExec },
        true
      )) as ExecuteReturnJson

    return {
      status: 'success',
      _webout: webout as string,
      log: parseLogToArray(log),
      httpHeaders
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
