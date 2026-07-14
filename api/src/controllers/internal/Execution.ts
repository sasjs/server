import path from 'path'
import fs from 'fs'
import { getSessionController, processProgram } from './'
import { readFile, fileExists, createFile, readFileBinary } from '@sasjs/utils'
import { PreProgramVars, Session, TreeNode, SessionState } from '../../types'
import {
  extractHeaders,
  getFilesFolder,
  HTTPHeaders,
  isDebugOn,
  RunTimeType
} from '../../utils'

export interface ExecutionVars {
  [key: string]: string | number | undefined
}

// Thrown when the session itself fails (e.g. SAS exits abnormally via
// %abort;). Carries the complete log - by the time this is thrown, the
// session's process has already exited, so the log file it wrote is final,
// not a partial/truncated snapshot.
export class SessionExecutionError extends Error {
  constructor(
    message: string,
    public log?: string
  ) {
    super(message)

    // required for `instanceof` to work when compiling to ES5, since the
    // default __extends helper does not preserve the prototype chain for
    // classes extending built-ins like Error
    Object.setPrototypeOf(this, SessionExecutionError.prototype)
  }
}

export interface ExecuteReturnRaw {
  httpHeaders: HTTPHeaders
  result: string | Buffer
}

interface ExecuteFileParams {
  programPath: string
  preProgramVariables: PreProgramVars
  vars: ExecutionVars
  otherArgs?: any
  returnJson?: boolean
  session?: Session
  runTime: RunTimeType
  forceStringResult?: boolean
}

interface ExecuteProgramParams extends Omit<ExecuteFileParams, 'programPath'> {
  program: string
  includePrintOutput?: boolean
}

export class ExecutionController {
  async executeFile({
    programPath,
    preProgramVariables,
    vars,
    otherArgs,
    returnJson,
    session,
    runTime,
    forceStringResult
  }: ExecuteFileParams) {
    const program = await readFile(programPath)

    return this.executeProgram({
      program,
      preProgramVariables,
      vars,
      otherArgs,
      returnJson,
      session,
      runTime,
      forceStringResult
    })
  }

  async executeProgram({
    program,
    preProgramVariables,
    vars,
    otherArgs,
    session: sessionByFileUpload,
    runTime,
    forceStringResult,
    includePrintOutput
  }: ExecuteProgramParams): Promise<ExecuteReturnRaw> {
    const sessionController = getSessionController(runTime)

    const session =
      sessionByFileUpload ?? (await sessionController.getSession())
    session.state = SessionState.running

    const logPath = path.join(session.path, 'log.log')
    const headersPath = path.join(session.path, 'stpsrv_header.txt')
    const weboutPath = path.join(session.path, 'webout.txt')
    const tokenFile = path.join(session.path, 'reqHeaders.txt')

    await createFile(weboutPath, '')
    await createFile(
      tokenFile,
      preProgramVariables?.httpHeaders.join('\n') ?? ''
    )

    try {
      await processProgram(
        program,
        preProgramVariables,
        vars,
        session,
        weboutPath,
        headersPath,
        tokenFile,
        runTime,
        logPath,
        otherArgs
      )
    } catch (err: any) {
      const log = (await fileExists(logPath)) ? await readFile(logPath) : ''

      throw new SessionExecutionError(err.message, log)
    }

    const log = (await fileExists(logPath)) ? await readFile(logPath) : ''
    const headersContent = (await fileExists(headersPath))
      ? await readFile(headersPath)
      : ''
    const httpHeaders: HTTPHeaders = extractHeaders(headersContent)

    if (isDebugOn(vars)) {
      httpHeaders['content-type'] = 'text/plain'
    }

    const fileResponse: boolean = httpHeaders.hasOwnProperty('content-type')

    const webout = (await fileExists(weboutPath))
      ? fileResponse && !forceStringResult
        ? await readFileBinary(weboutPath)
        : await readFile(weboutPath)
      : ''

    // it should be deleted by scheduleSessionDestroy
    //
    // Guarded: for JS/PY/R, processProgram sets state to `failed` itself
    // (without throwing) when the interpreter process exits non-zero - if
    // we unconditionally set `completed` here we'd silently overwrite that,
    // and anything downstream inspecting session.state (e.g.
    // scheduleSessionDestroy's expiresAfterMins branch in Session.ts) would
    // see a crashed session mis-reported as successful.
    if ((session.state as SessionState) !== SessionState.failed) {
      session.state = SessionState.completed
    }

    const resultParts = []

    // INFO: webout can be a Buffer, that is why it's length should be checked to determine if it is empty
    if (webout && webout.length !== 0) resultParts.push(webout)

    // INFO: log separator wraps the log from the beginning and the end
    resultParts.push(process.logsUUID)
    resultParts.push(log)
    resultParts.push(process.logsUUID)

    if (includePrintOutput && runTime === RunTimeType.SAS) {
      const printOutputPath = path.join(session.path, 'output.lst')
      const printOutput = (await fileExists(printOutputPath))
        ? await readFile(printOutputPath)
        : ''

      if (printOutput) resultParts.push(printOutput)
    }

    return {
      httpHeaders,
      result:
        isDebugOn(vars) || session.failureReason
          ? resultParts.join(`\n`)
          : webout
    }
  }

  buildDirectoryTree() {
    const root: TreeNode = {
      name: 'files',
      relativePath: '',
      absolutePath: getFilesFolder(),
      isFolder: true,
      children: []
    }

    const stack = [root]

    while (stack.length) {
      const currentNode = stack.pop()

      if (currentNode) {
        currentNode.isFolder = fs
          .statSync(currentNode.absolutePath)
          .isDirectory()

        const children = fs.readdirSync(currentNode.absolutePath)

        for (let child of children) {
          const absoluteChildPath = path.join(currentNode.absolutePath, child)
          // relative path will only be used in frontend component
          // so, no need to convert '/' to platform specific separator
          const relativeChildPath = `${currentNode.relativePath}/${child}`
          const childNode: TreeNode = {
            name: child,
            relativePath: relativeChildPath,
            absolutePath: absoluteChildPath,
            isFolder: false,
            children: []
          }
          currentNode.children.push(childNode)

          if (fs.statSync(childNode.absolutePath).isDirectory()) {
            stack.push(childNode)
          }
        }
      }
    }

    return root
  }
}
