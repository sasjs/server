import path from 'path'
import fs from 'fs'
import { getSessionController, processProgram } from './'
import { readFile, fileExists, createFile, readFileBinary } from '@sasjs/utils'
import { PreProgramVars, Session, TreeNode } from '../../types'
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

export interface ExecuteReturnRaw {
  httpHeaders: HTTPHeaders
  result: string | Buffer
}

export interface ExecuteReturnJson {
  httpHeaders: HTTPHeaders
  webout: string | Buffer
  log?: string
}

interface ExecuteFileParams {
  programPath: string
  preProgramVariables: PreProgramVars
  vars: ExecutionVars
  otherArgs?: any
  returnJson?: boolean
  session?: Session
  runTime: RunTimeType
}

interface ExecuteProgramParams extends Omit<ExecuteFileParams, 'programPath'> {
  program: string
}

export class ExecutionController {
  async executeFile({
    programPath,
    preProgramVariables,
    vars,
    otherArgs,
    returnJson,
    session,
    runTime
  }: ExecuteFileParams) {
    const program = await readFile(programPath)

    return this.executeProgram({
      program,
      preProgramVariables,
      vars,
      otherArgs,
      returnJson,
      session,
      runTime
    })
  }

  async executeProgram({
    program,
    preProgramVariables,
    vars,
    otherArgs,
    returnJson,
    session: sessionByFileUpload,
    runTime
  }: ExecuteProgramParams): Promise<ExecuteReturnRaw | ExecuteReturnJson> {
    const sessionController = getSessionController(runTime)

    const session =
      sessionByFileUpload ?? (await sessionController.getSession())
    session.inUse = true
    session.consumed = true

    const logPath = path.join(session.path, 'log.log')
    const headersPath = path.join(session.path, 'stpsrv_header.txt')
    const weboutPath = path.join(session.path, 'webout.txt')
    const tokenFile = path.join(session.path, 'reqHeaders.txt')

    await createFile(weboutPath, '')
    await createFile(
      tokenFile,
      preProgramVariables?.httpHeaders.join('\n') ?? ''
    )

    await processProgram(
      program,
      preProgramVariables,
      vars,
      session,
      weboutPath,
      tokenFile,
      runTime,
      logPath,
      otherArgs
    )

    const log = (await fileExists(logPath)) ? await readFile(logPath) : ''
    const headersContent = (await fileExists(headersPath))
      ? await readFile(headersPath)
      : ''
    const httpHeaders: HTTPHeaders = extractHeaders(headersContent)
    const fileResponse: boolean =
      httpHeaders.hasOwnProperty('content-type') &&
      !returnJson && // not a POST Request
      !isDebugOn(vars) // Debug is not enabled

    const webout = (await fileExists(weboutPath))
      ? fileResponse
        ? await readFileBinary(weboutPath)
        : await readFile(weboutPath)
      : ''

    // it should be deleted by scheduleSessionDestroy
    session.inUse = false

    if (returnJson) {
      return {
        httpHeaders,
        webout,
        log: isDebugOn(vars) || session.crashed ? log : undefined
      }
    }

    return {
      httpHeaders,
      result:
        isDebugOn(vars) || session.crashed
          ? `<html><body>${webout}<div style="text-align:left"><hr /><h2>SAS Log</h2><pre>${log}</pre></div></body></html>`
          : webout
    }
  }

  buildDirectoryTree() {
    const root: TreeNode = {
      name: 'files',
      relativePath: '',
      absolutePath: getFilesFolder(),
      children: []
    }

    const stack = [root]

    while (stack.length) {
      const currentNode = stack.pop()

      if (currentNode) {
        const children = fs.readdirSync(currentNode.absolutePath)

        for (let child of children) {
          const absoluteChildPath = `${currentNode.absolutePath}/${child}`
          const relativeChildPath = `${currentNode.relativePath}/${child}`
          const childNode: TreeNode = {
            name: child,
            relativePath: relativeChildPath,
            absolutePath: absoluteChildPath,
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
