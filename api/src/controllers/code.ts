import express from 'express'
import { Request, Security, Route, Tags, Post, Body } from 'tsoa'
import { ExecuteReturnJson, ExecutionController } from './internal'
import { PreProgramVars } from '../types'
import { ExecuteReturnJsonResponse } from '.'
import { parseLogToArray } from '../utils'

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
  ): Promise<ExecuteReturnJsonResponse | Buffer> {
    return executeSASCode(request, body)
  }
}

const executeSASCode = async (req: any, { code }: ExecuteSASCodePayload) => {
  try {
    const { webout, log, httpHeaders } =
      (await new ExecutionController().executeProgram(
        code,
        getPreProgramVariables(req),
        { ...req.query, _debug: 131 },
        undefined,
        true
      )) as ExecuteReturnJson

    if (webout instanceof Buffer) return webout

    return {
      status: 'success',
      _webout: webout,
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
