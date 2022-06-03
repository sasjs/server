import express from 'express'
import path from 'path'
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
  getFilesFolder,
  HTTPHeaders,
  isDebugOn,
  LogLine,
  makeFilesNamesMap,
  parseLogToArray
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
   * Trigger a SAS program using it's location in the _program URL parameter.
   * Enable debugging using the _debug URL parameter.  Setting _debug=131 will
   * cause the log to be streamed in the output.
   *
   * Additional URL parameters are turned into SAS macro variables.
   *
   * Any files provided in the request body are placed into the SAS session with
   * corresponding _WEBIN_XXX variables created.
   *
   * The response headers can be adjusted using the mfs_httpheader() macro.  Any
   * file type can be returned, including binary files such as zip or xls.
   *
   * If _debug is >= 131, response headers will contain Content-Type: 'text/plain'
   *
   * This behaviour differs for POST requests, in which case the response is
   * always JSON.
   *
   * @summary Execute Stored Program, return raw _webout content.
   * @param _program Location of SAS program
   * @example _program "/Public/somefolder/some.file"
   */
  @Get('/execute')
  public async executeReturnRaw(
    @Request() request: express.Request,
    @Query() _program: string
  ): Promise<string | Buffer> {
    return executeReturnRaw(request, _program)
  }

  /**
   * Trigger a SAS program using it's location in the _program URL parameter.
   * Enable debugging using the _debug URL parameter.  In any case, the log is
   * always returned in the log object.
   *
   * Additional URL parameters are turned into SAS macro variables.
   *
   * Any files provided in the request body are placed into the SAS session with
   * corresponding _WEBIN_XXX variables created.
   *
   * The response will be a JSON object with the following root attributes: log,
   * webout, headers.
   *
   * The webout will be a nested JSON object ONLY if the response-header
   * contains a content-type of application/json AND it is valid JSON.
   * Otherwise it will be a stringified version of the webout content.
   *
   * Response headers from the mfs_httpheader macro are simply listed in the
   * headers object, for POST requests they have no effect on the actual
   * response header.
   *
   * @summary Execute Stored Program, return JSON
   * @param _program Location of SAS program
   * @example _program "/Public/somefolder/some.file"
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
    const { result, httpHeaders } =
      (await new ExecutionController().executeFile(
        _program,
        getPreProgramVariables(req),
        query
      )) as ExecuteReturnRaw

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
    const { webout, log, httpHeaders } =
      (await new ExecutionController().executeFile(
        _program,
        getPreProgramVariables(req),
        { ...req.query, ...req.body },
        { filesNamesMap: filesNamesMap },
        true,
        req.sasjsSession
      )) as ExecuteReturnJson

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
