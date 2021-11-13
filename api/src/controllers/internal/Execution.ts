import path from 'path'
import fs from 'fs'
import { getSessionController } from './'
import { readFile, fileExists, createFile, moveFile } from '@sasjs/utils'
import { PreProgramVars, TreeNode } from '../../types'
import { generateFileUploadSasCode, getTmpFilesFolderPath } from '../../utils'

export class ExecutionController {
  async execute(
    programPath: string,
    preProgramVariables: PreProgramVars,
    vars: { [key: string]: string | number | undefined },
    otherArgs?: any,
    returnJson?: boolean
  ) {
    if (!(await fileExists(programPath)))
      throw 'ExecutionController: SAS file does not exist.'

    let program = await readFile(programPath)

    Object.keys(vars).forEach(
      (key: string) => (program = `%let ${key}=${vars[key]};\n${program}`)
    )

    const sessionController = getSessionController()

    const session = await sessionController.getSession()
    session.inUse = true

    const logPath = path.join(session.path, 'log.log')

    const weboutPath = path.join(session.path, 'webout.txt')
    await createFile(weboutPath, '')

    const tokenFile = path.join(session.path, 'accessToken.txt')
    await createFile(
      tokenFile,
      preProgramVariables?.accessToken ?? 'accessToken'
    )

    program = `
%let _sasjs_tokenfile=${tokenFile};
%let _sasjs_username=${preProgramVariables?.username};
%let _sasjs_userid=${preProgramVariables?.userId};
%let _sasjs_displayname=${preProgramVariables?.displayName};
%let _sasjs_apiserverurl=${preProgramVariables?.serverUrl};
%let _sasjs_apipath=/SASjsApi/stp/execute;
%let sasjsprocessmode=Stored Program;
filename _webout "${weboutPath}";
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

    const codePath = path.join(session.path, 'code.sas')

    // Creating this file in a RUNNING session will break out
    // the autoexec loop and actually execute the program
    // but - given it will take several milliseconds to create
    // (which can mean SAS trying to run a partial program, or
    // failing due to file lock) we first create the file THEN
    // we rename it.
    await createFile(codePath + '.bkp', program)
    await moveFile(codePath + '.bkp', codePath)

    // we now need to poll the session array
    while (!session.completed || !session.crashed) {
      await delay(50)
    }

    const log = (await fileExists(logPath)) ? await readFile(logPath) : ''
    const webout = (await fileExists(weboutPath))
      ? await readFile(weboutPath)
      : ''

    const debugValue =
      typeof vars._debug === 'string' ? parseInt(vars._debug) : vars._debug

    let debugResponse: string | undefined
    if ((debugValue && debugValue >= 131) || session.crashed) {
      debugResponse = `<html><body>${webout}<div style="text-align:left"><hr /><h2>SAS Log</h2><pre>${log}</pre></div></body></html>`
    }

    session.inUse = false
    sessionController.deleteSession(session)

    if (returnJson) return { result: debugResponse ?? webout, log }
    return debugResponse ?? webout
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

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
