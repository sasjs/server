import path from 'path'
import fs from 'fs'
import { getSessionController } from './'
import { readFile, fileExists, createFile } from '@sasjs/utils'
import { PreProgramVars, Session, TreeNode } from '../../types'
import { generateFileUploadSasCode, getTmpFilesFolderPath } from '../../utils'
export const delay = (ms: number) =>
new Promise((resolve) => setTimeout(resolve, ms))

export class ExecutionController {
  async execute(
    program = '',
    preProgramVariables?: PreProgramVars,
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

    const codePath = path.join(session.path, 'code.sas')
    
    // Creating this file in a RUNNING session will break out
    // the autoexec loop and actually execute the program
    // but - given it will take several milliseconds to create
    // (which can mean SAS trying to run a partial program, or
    // failing due to file lock) we first create the file THEN
    // we rename it.
    await createFile(codePath + '.bkp', program)
    fs.renameSync(codePath + '.bkp',codePath)

    // we now need to poll the session array 
    while (
      !session.completed
    ) { 
      await delay(50)
    }



    if (await fileExists(log)) log = await readFile(log)
    else log = ''

    if (await fileExists(webout)) webout = await readFile(webout)
    else webout = ''

    const debug = Object.keys(vars).find(
      (key: string) => key.toLowerCase() === '_debug'
    )

    let jsonResult
    if ((debug && vars[debug] >= 131)) {
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
