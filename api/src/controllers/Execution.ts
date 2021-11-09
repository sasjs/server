import path from 'path'
import fs from 'fs'
import { getSessionController } from './'
import { readFile, fileExists, createFile } from '@sasjs/utils'
import { configuration } from '../../package.json'
import { promisify } from 'util'
import { execFile } from 'child_process'
import { Session, TreeNode } from '../types'
import { generateFileUploadSasCode, getTmpFilesFolderPath } from '../utils'

const execFilePromise = promisify(execFile)

export class ExecutionController {
  async execute(
    program = '',
    autoExec?: string,
    session?: Session,
    vars?: any,
    otherArgs?: any,
    returnJson?: boolean
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

    program = `
%let sasjsprocessmode=Stored Program;
filename _webout "${webout}";
${program}`

    // if no files are uploaded filesNamesMap will be undefined
    if (otherArgs && otherArgs.filesNamesMap) {
      const uploadSasCode = await generateFileUploadSasCode(
        otherArgs.filesNamesMap,
        session.path
      )

      //If sas code for the file is generated it will be appended to the top of sasCode
      if (uploadSasCode.length > 0) {
        program = `${uploadSasCode}` + program
      }
    }

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

    if (await fileExists(webout)) webout = await readFile(webout)
    else webout = ''

    const debug = Object.keys(vars).find(
      (key: string) => key.toLowerCase() === '_debug'
    )

    let jsonResult
    if ((debug && vars[debug] >= 131) || stderr) {
      webout = `<html><body>
${webout}
<div style="text-align:left">
<hr /><h2>SAS Log</h2>
<pre>${log}</pre>
</div>
</body></html>`
    } else if (returnJson) {
      jsonResult = { result: webout, log: log }
    }

    session.inUse = false

    sessionController.deleteSession(session)

    return Promise.resolve(jsonResult || webout)
  }

  buildDirectorytree() {
    const root: TreeNode = {
      name: 'files',
      relativePath: '',
      absolutePath: getTmpFilesFolderPath(),
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
