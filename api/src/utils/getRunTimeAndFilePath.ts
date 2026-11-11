import { fileExists } from '@sasjs/utils'
import { isApiError, resolveProgram } from '@sasjs/api'
import { resolveWithinDrive } from './resolveWithinDrive'
import { RunTimeType } from '.'

/**
 * The program a request's `_program` names, and the run time its own name states.
 *
 * The rule - the extension the name states, otherwise `<path>.<runTime>` probed for
 * each run time this host offers, otherwise one refusal - is
 * `@sasjs/api`'s `resolveProgram`, so the mock and this server answer a missing
 * program (and a path that leaves the drive) with the same `400` and the same words.
 * What is this host's stays here: how a caller's path resolves against the drive, and
 * whether a file exists.
 *
 * The refusal is thrown as its message rather than as the API's error object, because
 * that is what every caller in this server renders - `res.status(400).send(err)` sends
 * the detail as text, and the package's own routes wrap it in an envelope instead. The
 * choice of rendering is the host's; the sentence is not.
 */
export const getRunTimeAndFilePath = async (programPath: string) => {
  // _program is caller-controlled and names a file under the SASjs Drive. Resolve it
  // against the drive root and refuse anything that escapes - path.join alone happily
  // follows '../..' to any directory the service account can read (and execute: SAS,
  // JS, PY and R files all run through here).
  try {
    const { path: codePath, runTime } = await resolveProgram(programPath, {
      // this host's containment answers `undefined` for a path it will not resolve
      resolve: (given: string) => resolveWithinDrive(given) ?? null,
      exists: fileExists,
      runTimes: process.runTimes
    })

    return { codePath, runTime: runTime as RunTimeType }
  } catch (error) {
    throw isApiError(error) ? error.message : error
  }
}
