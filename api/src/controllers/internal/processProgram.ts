import path from 'path'
import fs from 'fs'
import { execFileSync } from 'child_process'
import { once } from 'stream'
import { createFile, moveFile } from '@sasjs/utils'
import { PreProgramVars, Session } from '../../types'
import { RunTimeType } from '../../utils'
import {
  ExecutionVars,
  createSASProgram,
  createJSProgram,
  createPythonProgram,
  createRProgram
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
  otherArgs?: any
) => {
  if (runTime === RunTimeType.SAS) {
    program = await createSASProgram(
      program,
      preProgramVariables,
      vars,
      session,
      weboutPath,
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

    // we now need to poll the session status
    while (!session.completed) {
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

    try {
      await createFile(codePath, program)

      // create a stream that will write to console outputs to log file
      const writeStream = fs.createWriteStream(logPath)

      // waiting for the open event so that we can have underlying file descriptor
      await once(writeStream, 'open')

      execFileSync(executablePath, [codePath], {
        stdio: ['ignore', writeStream, writeStream]
      })

      // copy the code file to log and end write stream
      writeStream.end(program)

      session.completed = true
      console.log('session completed', session)
    } catch (err: any) {
      session.completed = true
      session.crashed = err.toString()
      console.log('session crashed', session.id, session.crashed)
    }
  }
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
