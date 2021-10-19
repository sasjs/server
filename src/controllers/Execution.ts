import { getSessionController } from './'
import { readFile, fileExists, createFile } from '@sasjs/utils'
import path from 'path'
import { configuration } from '../../package.json'
import { promisify } from 'util'
import { execFile } from 'child_process'
import { Session } from '../types'
const execFilePromise = promisify(execFile)

export class ExecutionController {
  async execute(
    program = '',
    autoExec?: string,
    session?: Session,
    vars?: any
  ) {
    if (program) {
      if (!(await fileExists(program))) {
        throw 'ExecutionController: SAS file does not exist.'
      }

      program = await readFile(program)

      if (vars) {
        Object.keys(vars).forEach(
          (key: string) => (program = `%let ${key}=${vars[key]};\n${program}`)
        )
      }
    }

    const sessionController = getSessionController()

    if (!session) {
      session = await sessionController.getSession()
      session.inUse = true
    }

    let log = path.join(session.path, 'log.log')

    let webout = path.join(session.path, 'webout.txt')
    await createFile(webout, '')

    program = `filename _webout "${webout}";\n${program}`

    const code = path.join(session.path, 'code.sas')
    if (!(await fileExists(code))) {
      await createFile(code, program)
    }

    let additionalArgs: string[] = []
    if (autoExec) additionalArgs = ['-AUTOEXEC', autoExec]

    const { stdout, stderr } = await execFilePromise(configuration.sasPath, [
      '-SYSIN',
      code,
      '-LOG',
      log,
      '-WORK',
      session.path,
      ...additionalArgs,
      process.platform === 'win32' ? '-nosplash' : ''
    ]).catch((err) => ({ stderr: err, stdout: '' }))

    if (await fileExists(log)) log = await readFile(log)
    else log = ''

    if (stderr) return Promise.reject({ error: stderr, log: log })

    if (await fileExists(webout)) webout = await readFile(webout)
    else webout = ''

    const debug = Object.keys(vars).find(
      (key: string) => key.toLowerCase() === '_debug'
    )

    if (debug && vars[debug] >= 131) {
      webout = `<html><body>
${webout}
<div style="text-align:left">
<hr /><h2>SAS Log</h2>
<pre>${log}</pre>
</div>
</body></html>`
    }

    session.inUse = false

    sessionController.deleteSession(session)

    return Promise.resolve(webout)
  }
}