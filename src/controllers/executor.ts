import { getSessionController } from './session'
import { readFile, deleteFile, fileExists, createFile } from '@sasjs/utils'
import path from 'path'
import { configuration } from '../../package.json'
import { promisify } from 'util'
import { execFile } from 'child_process'
const execFilePromise = promisify(execFile)

export class ExecutionController {
  async execute(program = '', autoExec?: string, debug?: number) {
    console.log(`[ExecutionController]program: `, program)
    console.log(`[ExecutionController]autoExec: `, autoExec)

    if (program) {
      if (!(await fileExists(program))) {
        throw 'SASjsServer/Executor: SAS file does not exist.'
      }

      program = await readFile(program)
    }

    const sessionController = getSessionController()
    const session = await sessionController.getSession()

    console.log(`[ExecutionController]session: `, session)

    let log = path.join(session.path, 'log.log')
    await createFile(log, '')

    let webout = path.join(session.path, 'webout.txt')
    await createFile(webout, '')

    const code = path.join(session.path, 'code')
    await createFile(code, program)

    let additionalArgs: string[] = []
    if (autoExec) additionalArgs = ['-AUTOEXEC', autoExec]

    const { stdout, stderr } = await execFilePromise(configuration.sasPath, [
      '-SYSIN',
      code,
      '-LOG',
      log,
      '-WORK',
      ...additionalArgs,
      session.path,
      process.platform === 'win32' ? '-nosplash' : ''
    ]).catch((err) => ({ stderr: err, stdout: '' }))

    log = await readFile(log)

    if (stderr) return Promise.reject({ error: stderr, log: log })

    webout = await readFile(webout)

    if (debug && debug >= 131) {
      webout = `<html><body>
${webout}
<div style="text-align:left">
<hr /><h2>SAS Log</h2>
<pre>${log}</pre>
</div>
</body></html>`
    }

    return Promise.resolve(webout)
  }
}
