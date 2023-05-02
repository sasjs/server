import express from 'express'
import { Request, Security, Route, Tags, Post, Body } from 'tsoa'
import { ExecutionController } from './internal'
import {
  getPreProgramVariables,
  getUserAutoExec,
  ModeType,
  parseLogToArray,
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
      addPrintOutput: true
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
