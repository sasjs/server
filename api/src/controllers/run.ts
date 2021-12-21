import express from 'express'
import { Request, Security, Route, Tags, Post, Body } from 'tsoa'
import { ExecutionController } from './internal'
import { PreProgramVars } from '../types'

interface RunSASPayload {
  /**
   * Code of SAS program
   * @example "* SAS Code HERE;"
   */
  code: string
}

@Security('bearerAuth')
@Route('SASjsApi/run')
@Tags('RUN')
export class RUNController {
  /**
   * Trigger a SAS program.
   * @summary Run SAS Program, return raw content
   */
  @Post('/code')
  public async runSAS(
    @Request() request: express.Request,
    @Body() body: RunSASPayload
  ): Promise<string> {
    return runSAS(request, body)
  }
}

const runSAS = async (req: any, { code }: RunSASPayload) => {
  try {
    const result = await new ExecutionController().executeProgram(
      code,
      getPreProgramVariables(req),
      { ...req.query, _debug: 131 }
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
