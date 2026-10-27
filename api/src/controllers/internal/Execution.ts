import path from 'path'
import fs from 'fs'
import { getSessionController, processProgram } from './'
import { readFile, fileExists, createFile, readFileBinary } from '@sasjs/utils'
import { PreProgramVars, Session, TreeNode, SessionState } from '../../types'
import {
  extractHeaders,
  getFilesFolder,
  HttpError,
  HTTPHeaders,
  isDebugOn,
  resolveWithinDrive,
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

    // A failed session (e.g. SAS via %abort;, or a non-zero JS/PY/R exit)
    // is a normal outcome of running arbitrary user code, not a
    // request-shape/server problem - processProgram resolves rather than
    // throwing in that case, and the session.failureReason check below
    // folds the log into the same result shape a successful run returns.
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

  /**
   * One level of the drive tree: the folder named by `relativePath`, with its
   * immediate children only.
   *
   * This is what the Studio browser uses. Fetching the whole tree per page load
   * costs a stat and a readdir for every entry on the drive, which grows with
   * the drive rather than with what the caller is looking at; loading one level
   * at a time keeps the cost proportional to the folders actually opened.
   *
   * Each child folder carries `hasChildren`, so the caller can offer an
   * expander for a folder whose contents it has not requested yet.
   */
  buildDirectoryLevel(relativePath: string): TreeNode {
    const absolutePath = resolveWithinDrive(relativePath)

    if (!absolutePath)
      throw new HttpError(400, 'folderPath cannot be outside drive.')

    if (!fs.existsSync(absolutePath))
      throw new HttpError(
        404,
        `The folder at (${relativePath || '/'}) does not exist.`
      )

    if (!fs.statSync(absolutePath).isDirectory())
      throw new HttpError(400, `The path at (${relativePath}) is not a folder.`)

    // The canonical spelling is derived from the RESOLVED path, not from the
    // request: a caller that sends `Public/../Public/x` gets `/Public/x` back,
    // which is the node the interface keys on. Echoing the request would return
    // a path no node matches, and the level would graft onto nothing.
    const normalisedPath = driveRelativePath(absolutePath)

    return {
      name: normalisedPath === '' ? 'files' : path.basename(normalisedPath),
      relativePath: normalisedPath,
      absolutePath,
      isFolder: true,
      children: listChildNodes(absolutePath, normalisedPath)
    }
  }
}

/**
 * The drive-relative form of a RESOLVED path: '' for the drive root, otherwise
 * a leading slash followed by the segments below it.
 *
 * Deriving it from the resolved path rather than from the request is what makes
 * it canonical: `Public/../Public/x`, `Public//x` and `/Public/x` all name one
 * node, and the interface keys nodes on exactly one spelling. A normaliser that
 * merely dropped empty and '.' segments would pass '..' straight through and
 * answer with a path no node matches.
 */
const driveRelativePath = (absolutePath: string) => {
  const segments = path
    .relative(path.resolve(getFilesFolder()), absolutePath)
    .split(path.sep)
    .filter((segment) => segment !== '' && segment !== '.')

  return segments.length ? '/' + segments.join('/') : ''
}

/**
 * The immediate children of one folder, in readdir order.
 *
 * Two kinds of entry are skipped and logged rather than failing the folder:
 *
 * - one that cannot be stat'ed (a dangling symlink, a subfolder the service
 *   account cannot read). It used to be fatal: the tree endpoints walk with
 *   statSync, so a single such entry answered 403 for the whole folder and the
 *   drive browser showed nothing at all.
 * - one whose REAL path leaves the drive. A symlink stored in the drive is
 *   listed by readdir and, because stat follows it, would otherwise be offered
 *   as an ordinary folder that the caller can then ask for by name.
 */
const listChildNodes = (
  absolutePath: string,
  relativeParentPath: string
): TreeNode[] => {
  const children: TreeNode[] = []
  const driveRootRealPath = fs.realpathSync(path.resolve(getFilesFolder()))

  for (const name of fs.readdirSync(absolutePath)) {
    const absoluteChildPath = path.join(absolutePath, name)
    const relativeChildPath = `${relativeParentPath}/${name}`

    let isFolder = false
    let hasChildren = false

    try {
      const realChildPath = fs.realpathSync(absoluteChildPath)
      const escaped = path.relative(driveRootRealPath, realChildPath)

      if (escaped.startsWith('..') || path.isAbsolute(escaped))
        throw new Error('real path is outside the drive')

      isFolder = fs.statSync(realChildPath).isDirectory()
      if (isFolder) hasChildren = fs.readdirSync(realChildPath).length > 0
    } catch (err: any) {
      process.logger.warn(
        `Drive entry skipped: ${relativeChildPath} (${
          err?.code ?? err?.message ?? err
        })`
      )
      continue
    }

    children.push({
      name,
      relativePath: relativeChildPath,
      absolutePath: absoluteChildPath,
      isFolder,
      children: [],
      hasChildren
    })
  }

  return children
}
