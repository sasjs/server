import { randomUUID } from 'crypto'
import { open, realpath, writeFile, unlink } from 'fs/promises'
import path from 'path'
import type { Request } from 'express'
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

/** Local Compute accepts only the exact definition token of a registered twin.
 * Never interpret the code submitted by the caller. */
export const executeLocalCompute = async (
  req: Request,
  program: string | string[],
  variables: Record<string, unknown> | undefined
) => {
  const vars = variables ?? {}
  const selector = vars._program
  const target = typeof selector === 'string' ? registry()[selector] : undefined
  const code =
    Array.isArray(program) && program.every((line) => typeof line === 'string')
      ? program.join('\n')
      : typeof program === 'string'
        ? program
        : ''
  if (
    !target ||
    code !== localComputeCode(selector as string) ||
    !process.runTimes.includes(RunTimeType.JS)
  )
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
