import path from 'path'
import { WriteStream, createWriteStream } from 'fs'
import { spawn } from 'child_process'
import { once } from 'stream'
import { createFile, moveFile } from '@sasjs/utils'
import { PreProgramVars, Session, SessionState } from '../../types'
import { RunTimeType } from '../../utils'
import {
  ExecutionVars,
  createSASProgram,
  createJSProgram,
  createPythonProgram,
  createRProgram,
  createViyaSASProgram,
  executeViyaProgram,
  readProcessStartTime
} from './'

export const processProgram = async (
  program: string,
  preProgramVariables: PreProgramVars,
  vars: ExecutionVars,
  session: Session,
  weboutPath: string,
  headersPath: string,
  tokenFile: string,
  runTime: RunTimeType,
  logPath: string,
  otherArgs?: any,
  onSpawn?: (pid: number) => void
) => {
  if (runTime === RunTimeType.SASVIYA) {
    const viyaProgram = await createViyaSASProgram(
      program,
      preProgramVariables,
      vars,
      otherArgs
    )

    try {
      const { webout, log } = await executeViyaProgram(viyaProgram, session.id)

      await createFile(weboutPath, webout)
      await createFile(logPath, log)
    } catch (err: any) {
      // The run failed on the Viya side. processProgram resolves rather than
      // throwing, so Execution.ts folds session.failureReason into the response
      // - the same shape a local SAS %abort; produces. The reason is written to
      // the log file so the caller sees why, not just that it failed.
      session.state = SessionState.failed
      session.failureReason = err?.message ?? err.toString()

      await createFile(logPath, session.failureReason as string)

      process.logger.error(
        'viya session crashed',
        session.id,
        session.failureReason
      )
    }

    return
  }

  if (runTime === RunTimeType.SAS) {
    program = await createSASProgram(
      program,
      preProgramVariables,
      vars,
      session,
      weboutPath,
      headersPath,
      tokenFile,
      otherArgs
    )

    const codePath = path.join(session.path, 'code.sas')

    // Creating this file in a RUNNING session will break out
    // the autoexec loop and actually execute the program
    // but - given it will take several milliseconds to create
    // (which can mean SAS trying to run a partial program, or
    // failing due to file lock) we first create the file THEN
    // we rename it.
    await createFile(codePath + '.bkp', program)
    await moveFile(codePath + '.bkp', codePath)

    // we now need to poll the session status. A failed session (e.g. from
    // %abort;) is not a request-shape/server problem - it's a normal
    // outcome of running arbitrary user code, same as a SAS ERROR: in the
    // log without %abort;. So we just stop polling rather than throwing;
    // Execution.ts already knows how to turn session.failureReason into a
    // 200 response with the log embedded, matching how JS/PY/R (the else
    // branch below) has always handled a failed session.
    while (
      session.state !== SessionState.completed &&
      session.state !== SessionState.failed
    ) {
      await delay(50)
    }
  } else {
    let codePath: string
    let executablePath: string
    switch (runTime) {
      case RunTimeType.JS:
        program = await createJSProgram(
          program,
          preProgramVariables,
          vars,
          session,
          weboutPath,
          headersPath,
          tokenFile,
          otherArgs
        )
        codePath = path.join(session.path, 'code.js')
        executablePath = process.nodeLoc!

        break
      case RunTimeType.PY:
        program = await createPythonProgram(
          program,
          preProgramVariables,
          vars,
          session,
          weboutPath,
          headersPath,
          tokenFile,
          otherArgs
        )
        codePath = path.join(session.path, 'code.py')
        executablePath = process.pythonLoc!

        break
      case RunTimeType.R:
        program = await createRProgram(
          program,
          preProgramVariables,
          vars,
          session,
          weboutPath,
          headersPath,
          tokenFile,
          otherArgs
        )
        codePath = path.join(session.path, 'code.r')
        executablePath = process.rLoc!

        break
      default:
        throw new Error('Invalid runtime!')
    }

    await createFile(codePath, program)

    // create a stream that will write to console outputs to log file
    const writeStream = createWriteStream(logPath)
    // waiting for the open event so that we can have underlying file descriptor
    await once(writeStream, 'open')

    await runInterpreter(
      session,
      executablePath,
      [codePath],
      writeStream,
      onSpawn
    )
      .then(() => {
        session.state = SessionState.completed
        // the process is gone and its pid can be recycled
        session.pid = undefined
        session.pidStartedAt = undefined

        process.logger.info('session completed', session)
      })
      .catch((err) => {
        session.state = SessionState.failed
        session.pid = undefined
        session.pidStartedAt = undefined

        session.failureReason = err.toString()

        // A run the shutdown ended on purpose is not a crash: the interpreter
        // exits non-zero because it was signalled (sasjs/server#162)
        if (session.terminatedByShutdown)
          return process.logger.info('session ended by shutdown', session.id)

        process.logger.error(
          'session crashed',
          session.id,
          session.failureReason
        )
      })

    // copy the code file to log and end write stream
    writeStream.end(program)
  }
}

/**
 * Runs an interpreter with the session's streams attached.
 *
 * `spawn` rather than `execFile`, because the output is already being written
 * to the session log as it arrives: `execFile`'s callback buffers a second copy
 * of stdout and stderr in memory, and once a program writes more than its
 * default 1 MiB `maxBuffer` Node kills the interpreter. The log then ends
 * mid-program and the session is marked crashed, on a run that was working -
 * a chatty stored program lost its output at the same few thousand lines
 * whatever it was printing. Nothing reads the buffers, so nothing is buffered.
 *
 * @param file - The name or path of the executable file to run.
 * @param args - List of arguments.
 * @param writeStream - The child's stdout and stderr are written to it.
 *
 * @returns - Resolves when the child exits with code 0, and rejects with the
 * error `execFile` would have produced otherwise.
 */
const runInterpreter = (
  session: Session,
  file: string,
  args: string[],
  writeStream: WriteStream,
  onSpawn?: (pid: number) => void
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const child = spawn(file, args)

    // the interpreter's pid, so a trigger response can name the process
    if (child.pid) {
      session.pid = child.pid
      session.pidStartedAt = readProcessStartTime(child.pid)

      onSpawn?.(child.pid)
    }

    child.stdout?.on('data', (data) => {
      writeStream.write(data)
    })

    child.stderr?.on('data', (data) => {
      writeStream.write(data)
    })

    // A child that never started (a missing interpreter, a permission denied)
    // reports here rather than through an exit code.
    child.on('error', (err) => reject(err))

    child.on('close', (code, signal) => {
      if (code === 0) return resolve()

      // The shape execFile reports: the failure is the exit status, and the
      // caller turns `err.toString()` into the session's failureReason.
      const err = new Error(
        `Command failed: ${file} ${args.join(' ')}`
      ) as Error & { code?: number | null; signal?: string | null }
      err.code = code
      err.signal = signal

      reject(err)
    })
  })
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
