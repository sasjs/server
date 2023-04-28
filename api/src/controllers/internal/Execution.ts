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
    forceStringResult
  }: ExecuteProgramParams): Promise<ExecuteReturnRaw> {
    const sessionController = getSessionController(runTime)

    const session =
      sessionByFileUpload ?? (await sessionController.getSession())
    session.inUse = true
    session.consumed = true

    const logPath = path.join(session.path, 'log.log')
    const printOutputPath = path.join(session.path, 'output.lst')
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
      headersPath,
      tokenFile,
      runTime,
      logPath,
      otherArgs
    )

    const log = (await fileExists(logPath)) ? await readFile(logPath) : ''
    const printOutput = (await fileExists(printOutputPath))
      ? await readFile(printOutputPath)
      : ''
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
    session.inUse = false

    const resultParts = []

    if (webout) resultParts.push(webout)

    resultParts.push(process.logsUUID)
    resultParts.push(log)

    if (printOutput) {
      resultParts.push(process.logsUUID)
      resultParts.push(printOutput)
    }

    return {
      httpHeaders,
      result:
        isDebugOn(vars) || session.crashed ? resultParts.join(`\n`) : webout
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
