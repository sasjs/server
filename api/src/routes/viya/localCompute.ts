import { createHash, randomUUID } from 'crypto'
import { open, realpath, writeFile, unlink } from 'fs/promises'
import path from 'path'
import type { Request } from 'express'
import { persistedDefinition } from './persistedDefinition'
import { ExecutionController } from '../../controllers/internal'
import {
  getFilesFolder,
  getPreProgramVariables,
  RunTimeType
} from '../../utils'
import { SessionState } from '../../types'
import {
  claimSession,
  localComputeCode,
  registry,
  takeUploads
} from './localJes'

type LocalComputeRun = {
  log: string
  webout?: string
  state?: 'completed' | 'warning' | 'error' | 'failed'
  jobConditionCode?: number
}

/** Local Compute accepts only the exact definition token of a registered twin.
 * Never interpret the code submitted by the caller. */
export const executeLocalCompute = async (
  req: Request,
  program: string | string[],
  variables: Record<string, unknown> | undefined
): Promise<LocalComputeRun> => {
  const vars = variables ?? {}
  const selector = vars._program
  const target = typeof selector === 'string' ? registry()[selector] : undefined
  const code =
    Array.isArray(program) && program.every((line) => typeof line === 'string')
      ? program.join('\n')
      : typeof program === 'string'
        ? program
        : ''
  // A static response requires an operator-authorized digest of the exact
  // submitted string (arrays are joined exactly as the Compute host does).
  // It is never evaluated as either SAS or JavaScript.
  if (process.env.LOCAL_VIYA_SCRIPT_MOCKS !== undefined) {
    if (
      process.env.MODE !== 'desktop' ||
      !['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(
        req.socket?.remoteAddress ?? ''
      )
    )
      throw new Error('Local script mock requires a loopback desktop client.')
    // Bound the entire operator-supplied registry before parsing, as well as
    // individual log entries; no registration is accepted from the request.
    if (
      Buffer.byteLength(process.env.LOCAL_VIYA_SCRIPT_MOCKS, 'utf8') >
      2 * 1024 * 1024
    )
      throw new Error('Invalid local script mock registry.')
    let mocks: unknown
    try {
      mocks = JSON.parse(process.env.LOCAL_VIYA_SCRIPT_MOCKS)
    } catch {
      throw new Error('Invalid local script mock registry.')
    }
    if (
      !mocks ||
      typeof mocks !== 'object' ||
      Array.isArray(mocks) ||
      Object.keys(mocks).length > 256
    )
      throw new Error('Invalid local script mock registry.')
    if (
      !code.length ||
      (typeof program !== 'string' &&
        !(
          Array.isArray(program) &&
          program.every((line) => typeof line === 'string')
        ))
    )
      throw new Error('Invalid local script mock code.')
    // UTF-8 encoding replaces lone surrogates with U+FFFD, making distinct
    // JavaScript strings hash identically. Refuse them before authorization.
    for (let i = 0; i < code.length; i++) {
      const unit = code.charCodeAt(i)
      if (unit >= 0xd800 && unit <= 0xdbff) {
        const next = code.charCodeAt(++i)
        if (!(next >= 0xdc00 && next <= 0xdfff))
          return {
            state: 'failed',
            log: 'Mock Compute (not SAS)\nInvalid local script mock code.'
          }
      } else if (unit >= 0xdc00 && unit <= 0xdfff) {
        return {
          state: 'failed',
          log: 'Mock Compute (not SAS)\nInvalid local script mock code.'
        }
      }
    }
    const digest = createHash('sha256').update(code).digest('hex')
    const entry = Object.prototype.hasOwnProperty.call(mocks, digest)
      ? (mocks as Record<string, unknown>)[digest]
      : undefined
    if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
      const response = entry as Record<string, unknown>
      if (
        (response.state === 'completed' ||
          response.state === 'failed' ||
          response.state === 'warning' ||
          response.state === 'error') &&
        typeof response.log === 'string' &&
        response.log.length <= 1024 * 1024 &&
        (response.jobConditionCode === undefined ||
          (typeof response.jobConditionCode === 'number' &&
            Number.isSafeInteger(response.jobConditionCode) &&
            response.jobConditionCode >= 0 &&
            response.jobConditionCode <= 2147483647))
      ) {
        const state = response.state
        return {
          log: `Mock Compute (not SAS)\n${response.log}`,
          state,
          ...(response.jobConditionCode === undefined
            ? {}
            : { jobConditionCode: response.jobConditionCode })
        }
      }
    }
    throw new Error('Unregistered local script mock.')
  }
  let matches = code === localComputeCode(selector as string)
  if (target && !matches && typeof selector === 'string') {
    // The adapter submits persisted code normalized from CRLF into lines.
    const definition = await persistedDefinition(req, selector)
    matches =
      definition !== undefined &&
      definition.code.replace(/\r\n/g, '\n') === code
  }
  if (!target || !matches || !process.runTimes.includes(RunTimeType.JS))
    throw new Error('Local JS mock: invalid registered definition or selector.')
  // Open first, check the actual descriptor target, then read that descriptor;
  // symlink swaps cannot redirect the read after the check. Linux procfs required.
  const root = await realpath(getFilesFolder())
  const file = await open(path.join(root, target), 'r')
  let twin: string
  try {
    const actual = await realpath(`/proc/self/fd/${file.fd}`)
    if (!actual.startsWith(root + path.sep) || !(await file.stat()).isFile())
      throw new Error('Unconfined twin')
    twin = await file.readFile('utf8')
  } finally {
    await file.close()
  }
  const parts = takeUploads(vars)
  const pre = getPreProgramVariables(req)
  const session = await claimSession(pre.username)
  const staged: string[] = []
  try {
    const filesNamesMap: Record<
      string,
      { fieldName: string; originalName: string }
    > = {}
    for (const part of parts) {
      const fileName = `req_file_${randomUUID().replace(/-/g, '')}`
      const filePath = path.join(session.path, fileName)
      staged.push(filePath)
      await writeFile(filePath, part.content)
      filesNamesMap[fileName] = {
        fieldName: part.field,
        originalName: `${part.field}.csv`
      }
    }
    const safeVars: Record<string, string | number> = {}
    for (const [key, value] of Object.entries(vars)) {
      if (
        (typeof value === 'string' || typeof value === 'number') &&
        !/^_webin_/i.test(key)
      )
        safeVars[key] = value
    }
    safeVars._debug = Number(vars._DEBUG ?? 0)
    const output = await new ExecutionController().executeProgram({
      program: twin,
      runTime: RunTimeType.JS,
      vars: safeVars,
      preProgramVariables: pre,
      otherArgs: { filesNamesMap },
      session,
      separateWebout: true
    })
    const log = `JS mock (not SAS)\n${output.log}`
    if (output.failureReason) return { log, state: 'failed' as const }
    return { webout: output.result.toString(), log }
  } catch (error) {
    session.state = SessionState.failed
    throw error
  } finally {
    await Promise.all(
      staged.map((filePath) => unlink(filePath).catch(() => undefined))
    )
  }
}
