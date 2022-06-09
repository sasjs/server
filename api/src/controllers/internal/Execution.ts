import path from 'path'
import fs from 'fs'
import { execFileSync } from 'child_process'
import { once } from 'stream'
import { getSASSessionController, getJSSessionController } from './'
import {
  readFile,
  fileExists,
  createFile,
  moveFile,
  readFileBinary
} from '@sasjs/utils'
import { PreProgramVars, Session, TreeNode } from '../../types'
import {
  extractHeaders,
  generateFileUploadSasCode,
  generateFileUploadJSCode,
  getFilesFolder,
  getMacrosFolder,
  HTTPHeaders,
  isDebugOn,
  SASJSRunTimes
} from '../../utils'

export interface ExecutionVars {
  [key: string]: string | number | undefined
}

export interface ExecuteReturnRaw {
  httpHeaders: HTTPHeaders
  result: string | Buffer
}

export interface ExecuteReturnJson {
  httpHeaders: HTTPHeaders
  webout: string | Buffer
  log?: string
}

export class ExecutionController {
  async executeFile(
    programPath: string,
    preProgramVariables: PreProgramVars,
    vars: ExecutionVars,
    otherArgs?: any,
    returnJson?: boolean,
    session?: Session
  ) {
    for (const runTime of process.runTimes) {
      const codePath =
        path
          .join(getFilesFolder(), programPath)
          .replace(new RegExp('/', 'g'), path.sep) +
        '.' +
        runTime
      if (await fileExists(codePath)) {
        const program = await readFile(codePath)

        if (runTime === SASJSRunTimes.JS) {
          return this.executeProgram(
            program,
            preProgramVariables,
            vars,
            otherArgs,
            returnJson,
            session,
            runTime
          )
        } else {
          return this.executeProgram(
            program,
            preProgramVariables,
            vars,
            otherArgs,
            returnJson,
            session,
            runTime
          )
        }
      }
    }
    throw `ExecutionController: ${programPath} file does not exist.`
  }

  async executeProgram(
    program: string,
    preProgramVariables: PreProgramVars,
    vars: ExecutionVars,
    otherArgs?: any,
    returnJson?: boolean,
    sessionByFileUpload?: Session,
    runTime: string = 'sas'
  ): Promise<ExecuteReturnRaw | ExecuteReturnJson> {
    const sessionController =
      runTime === SASJSRunTimes.JS
        ? getJSSessionController()
        : getSASSessionController()

    const session =
      sessionByFileUpload ?? (await sessionController.getSession())
    session.inUse = true
    session.consumed = true

    const logPath = path.join(session.path, 'log.log')
    const headersPath = path.join(session.path, 'stpsrv_header.txt')
    const weboutPath = path.join(session.path, 'webout.txt')
    const tokenFile = path.join(session.path, 'reqHeaders.txt')

    await createFile(weboutPath, '')
    await createFile(
      tokenFile,
      preProgramVariables?.httpHeaders.join('\n') ?? ''
    )

    if (runTime === SASJSRunTimes.JS) {
      program = await this.createJSProgram(
        program,
        preProgramVariables,
        vars,
        session,
        weboutPath,
        tokenFile,
        otherArgs
      )

      const codePath = path.join(session.path, 'code.js')

      try {
        await createFile(codePath, program)

        // create a stream that will write to console outputs to log file
        const writeStream = fs.createWriteStream(logPath)

        // waiting for the open event so that we can have underlying file descriptor
        await once(writeStream, 'open')

        execFileSync('node', [codePath], {
          stdio: ['ignore', writeStream, writeStream]
        })

        // copy the code.js program to log and end write stream
        writeStream.end(program)

        session.completed = true
        console.log('session completed', session)
      } catch (err: any) {
        session.completed = true
        session.crashed = err.toString()
        console.log('session crashed', session.id, session.crashed)
      }
    } else {
      program = await this.createSASProgram(
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
    }

    const log = (await fileExists(logPath)) ? await readFile(logPath) : ''
    const headersContent = (await fileExists(headersPath))
      ? await readFile(headersPath)
      : ''
    const httpHeaders: HTTPHeaders = extractHeaders(headersContent)
    const fileResponse: boolean =
      httpHeaders.hasOwnProperty('content-type') &&
      !returnJson && // not a POST Request
      !isDebugOn(vars) // Debug is not enabled

    const webout = (await fileExists(weboutPath))
      ? fileResponse
        ? await readFileBinary(weboutPath)
        : await readFile(weboutPath)
      : ''

    // it should be deleted by scheduleSessionDestroy
    session.inUse = false

    if (returnJson) {
      return {
        httpHeaders,
        webout,
        log: isDebugOn(vars) || session.crashed ? log : undefined
      }
    }

    return {
      httpHeaders,
      result:
        isDebugOn(vars) || session.crashed
          ? `<html><body>${webout}<div style="text-align:left"><hr /><h2>SAS Log</h2><pre>${log}</pre></div></body></html>`
          : webout
    }
  }

  private async createSASProgram(
    program: string,
    preProgramVariables: PreProgramVars,
    vars: ExecutionVars,
    session: Session,
    weboutPath: string,
    tokenFile: string,
    otherArgs?: any
  ) {
    const varStatments = Object.keys(vars).reduce(
      (computed: string, key: string) =>
        `${computed}%let ${key}=${vars[key]};\n`,
      ''
    )

    const preProgramVarStatments = `
%let _sasjs_tokenfile=${tokenFile};
%let _sasjs_username=${preProgramVariables?.username};
%let _sasjs_userid=${preProgramVariables?.userId};
%let _sasjs_displayname=${preProgramVariables?.displayName};
%let _sasjs_apiserverurl=${preProgramVariables?.serverUrl};
%let _sasjs_apipath=/SASjsApi/stp/execute;
%let _metaperson=&_sasjs_displayname;
%let _metauser=&_sasjs_username;
%let sasjsprocessmode=Stored Program;
%let sasjs_stpsrv_header_loc=%sysfunc(pathname(work))/../stpsrv_header.txt;

%global SYSPROCESSMODE SYSTCPIPHOSTNAME SYSHOSTINFOLONG;
%macro _sasjs_server_init();
  %if "&SYSPROCESSMODE"="" %then %let SYSPROCESSMODE=&sasjsprocessmode;
  %if "&SYSTCPIPHOSTNAME"="" %then %let SYSTCPIPHOSTNAME=&_sasjs_apiserverurl;
%mend;
%_sasjs_server_init()
`

    program = `
options insert=(SASAUTOS="${getMacrosFolder()}");

/* runtime vars */
${varStatments}
filename _webout "${weboutPath}" mod;

/* dynamic user-provided vars */
${preProgramVarStatments}

/* user autoexec starts */
${otherArgs?.userAutoExec ?? ''}
/* user autoexec ends */

/* actual job code */
${program}`

    // if no files are uploaded filesNamesMap will be undefined
    if (otherArgs?.filesNamesMap) {
      const uploadSasCode = await generateFileUploadSasCode(
        otherArgs.filesNamesMap,
        session.path
      )

      //If sas code for the file is generated it will be appended to the top of sasCode
      if (uploadSasCode.length > 0) {
        program = `${uploadSasCode}` + program
      }
    }
    return program
  }

  private async createJSProgram(
    program: string,
    preProgramVariables: PreProgramVars,
    vars: ExecutionVars,
    session: Session,
    weboutPath: string,
    tokenFile: string,
    otherArgs?: any
  ) {
    const varStatments = Object.keys(vars).reduce(
      (computed: string, key: string) =>
        `${computed}const ${key} = '${vars[key]}';\n`,
      ''
    )

    const preProgramVarStatments = `
const weboutPath = '${weboutPath}'; 
const _sasjs_tokenfile = '${tokenFile}';
const _sasjs_username = '${preProgramVariables?.username}';
const _sasjs_userid = '${preProgramVariables?.userId}';
const _sasjs_displayname = '${preProgramVariables?.displayName}';
const _metaperson = _sasjs_displayname;
const _metauser = _sasjs_username;
const sasjsprocessmode = 'Stored Program';
`

    const requiredModules = `const fs = require('fs-extra')`

    program = `
/* runtime vars */
${varStatments}

/* dynamic user-provided vars */
${preProgramVarStatments}

/* actual job code */
${program}

/* write webout file*/
fs.promises.writeFile(weboutPath, _webout)
`
    // if no files are uploaded filesNamesMap will be undefined
    if (otherArgs?.filesNamesMap) {
      const uploadJSCode = await generateFileUploadJSCode(
        otherArgs.filesNamesMap,
        session.path
      )

      //If js code for the file is generated it will be appended to the top of jsCode
      if (uploadJSCode.length > 0) {
        program = `${uploadJSCode}\n` + program
      }
    }
    return requiredModules + program
  }

  buildDirectoryTree() {
    const root: TreeNode = {
      name: 'files',
      relativePath: '',
      absolutePath: getFilesFolder(),
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
