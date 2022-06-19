import express from 'express'
import {
  Request,
  Security,
  Route,
  Tags,
  Post,
  Body,
  Get,
  Query,
  Example
} from 'tsoa'
import {
  ExecuteReturnJson,
  ExecuteReturnRaw,
  ExecutionController,
  ExecutionVars
} from './internal'
import {
  getPreProgramVariables,
  HTTPHeaders,
  isDebugOn,
  LogLine,
  makeFilesNamesMap,
  parseLogToArray,
  getRunTimeAndFilePath
} from '../utils'
import { MulterFile } from '../types/Upload'

interface ExecuteReturnJsonPayload {
  /**
   * Location of SAS program
   * @example "/Public/somefolder/some.file"
   */
  _program?: string
}

interface IRecordOfAny {
  [key: string]: any
}
export interface ExecuteReturnJsonResponse {
  status: string
  _webout: string | IRecordOfAny
  log: LogLine[]
  message?: string
  httpHeaders: HTTPHeaders
}

@Security('bearerAuth')
@Route('SASjsApi/stp')
@Tags('STP')
export class STPController {
  /**
   * Trigger a SAS or JS program using the _program URL parameter.
   *
   * Accepts URL parameters and file uploads.  For more details, see docs:
   *
   * https://server.sasjs.io/storedprograms
   *
   * @summary Execute a Stored Program, returns raw _webout content.
   * @param _program Location of SAS or JS code
   * @example _program "/Projects/myApp/some/program"
   */
  @Get('/execute')
  public async executeReturnRaw(
    @Request() request: express.Request,
    @Query() _program: string
  ): Promise<string | Buffer> {
    return executeReturnRaw(request, _program)
  }

  /**
   * Trigger a SAS or JS program using the _program URL parameter.
   *
   * Accepts URL parameters and file uploads.  For more details, see docs:
   *
   * https://server.sasjs.io/storedprograms
   *
   * The response will be a JSON object with the following root attributes:
   * log, webout, headers.
   *
   * The webout attribute will be nested JSON ONLY if the response-header
   * contains a content-type of application/json AND it is valid JSON.
   * Otherwise it will be a stringified version of the webout content.
   *
   * @summary Execute a Stored Program, return a JSON object
   * @param _program Location of SAS or JS code
   * @example _program "/Projects/myApp/some/program"
   */
  @Example<ExecuteReturnJsonResponse>({
    status: 'success',
    _webout: 'webout content',
    log: [],
    httpHeaders: {
      'Content-type': 'application/zip',
      'Cache-Control': 'public, max-age=1000'
    }
  })
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
): Promise<string | Buffer> => {
  const query = req.query as ExecutionVars

  try {
    const { codePath, runTime } = await getRunTimeAndFilePath(_program)

    const { result, httpHeaders } =
      (await new ExecutionController().executeFile({
        programPath: codePath,
        preProgramVariables: getPreProgramVariables(req),
        vars: query,
        runTime
      })) as ExecuteReturnRaw

    // Should over-ride response header for debug
    // on GET request to see entire log rendering on browser.
    if (isDebugOn(query)) {
      httpHeaders['content-type'] = 'text/plain'
    }

    req.res?.set(httpHeaders)

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

const executeReturnJson = async (
  req: express.Request,
  _program: string
): Promise<ExecuteReturnJsonResponse> => {
  const filesNamesMap = req.files?.length
    ? makeFilesNamesMap(req.files as MulterFile[])
    : null

  try {
    const { codePath, runTime } = await getRunTimeAndFilePath(_program)

    const { webout, log, httpHeaders } =
      (await new ExecutionController().executeFile({
        programPath: codePath,
        preProgramVariables: getPreProgramVariables(req),
        vars: { ...req.query, ...req.body },
        otherArgs: { filesNamesMap: filesNamesMap },
        returnJson: true,
        session: req.sasjsSession,
        runTime
      })) as ExecuteReturnJson

    let weboutRes: string | IRecordOfAny = webout
    if (httpHeaders['content-type']?.toLowerCase() === 'application/json') {
      try {
        weboutRes = JSON.parse(webout as string)
      } catch (_) {}
    }

    return {
      status: 'success',
      _webout: weboutRes,
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
