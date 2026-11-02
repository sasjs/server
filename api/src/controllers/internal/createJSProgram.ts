import path from 'path'
import { createFile } from '@sasjs/utils'
import { PreProgramVars, Session } from '../../types'
import { generateFileUploadJSCode } from '../../utils'
import {
  asLiteral,
  partitionParameterNames,
  reportDroppedParameterNames
} from '../../utils/programVariables'
import { ExecutionVars } from './'
import { weboutHelperFileName, weboutHelperSource } from './weboutHelper'

export const createJSProgram = async (
  program: string,
  preProgramVariables: PreProgramVars,
  vars: ExecutionVars,
  session: Session,
  weboutPath: string,
  headersPath: string,
  tokenFile: string,
  otherArgs?: any
) => {
  const { safe, dropped } = partitionParameterNames(vars)
  reportDroppedParameterNames(dropped)

  // The webout() helper lives beside the generated program and is required by
  // it, so the program itself stays free of runtime plumbing. It is written on
  // every execution, so a session folder can never carry a stale copy.
  await createFile(
    path.join(session.path, weboutHelperFileName),
    weboutHelperSource
  )

  const varStatments = safe.reduce(
    (computed: string, key: string) =>
      `${computed}const ${key} = ${asLiteral(vars[key])};\n`,
    ''
  )

  const preProgramVarStatments = `
let _webout = '';
const weboutPath = ${asLiteral(weboutPath)}; 
const _SASJS_TOKENFILE = ${asLiteral(tokenFile)};
const _SASJS_WEBOUT_HEADERS = ${asLiteral(headersPath)};
const _SASJS_APISERVERURL = ${asLiteral(
    preProgramVariables?.localServerUrl ?? preProgramVariables?.serverUrl
  )};
const _SASJS_USERNAME = ${asLiteral(preProgramVariables?.username)};
const _SASJS_USERID = ${asLiteral(preProgramVariables?.userId)};
const _SASJS_DISPLAYNAME = ${asLiteral(preProgramVariables?.displayName)};
const _METAPERSON = _SASJS_DISPLAYNAME;
const _METAUSER = _SASJS_USERNAME;
const SASJSPROCESSMODE = 'Stored Program';

/* %ms_webout() for JS - webout('OPEN'), webout('OBJ', name, rows), webout('CLOSE') */
const _sasjs_webout = require('./${weboutHelperFileName}')({
  weboutPath: weboutPath,
  headersPath: _SASJS_WEBOUT_HEADERS,
  program: ${asLiteral(vars._program)},
  debug: ${asLiteral(vars._debug)},
  username: _SASJS_USERNAME,
  userId: _SASJS_USERID,
  apiServerUrl: _SASJS_APISERVERURL
});
globalThis.webout = _sasjs_webout;
`

  // Both are assigned as globals rather than declared as consts, so a program
  // that declares its own `fs` or `webout` shadows it in its own scope instead
  // of colliding with the runtime's declaration and failing to parse.
  const requiredModules = `globalThis.fs = require('fs')`

  program = `
/* runtime vars */
${varStatments}

/* dynamic user-provided vars */
${preProgramVarStatments}

/* actual job code */
${program}

/* webout() streams its own body as it is called. _webout is written here, and
   anything the program left unfinished is reported - the reserved handle is
   used so a program that declares its own webout cannot break this. */
_sasjs_webout.finalise(_webout)
`
  // if no files are uploaded filesNamesMap will be undefined
  if (otherArgs?.filesNamesMap) {
    const uploadJsCode = await generateFileUploadJSCode(
      otherArgs.filesNamesMap,
      session.path
    )

    // If any files are uploaded, the program needs to be updated with some
    // dynamically generated variables (pointers) for ease of ingestion
    if (uploadJsCode.length > 0) {
      program = `${uploadJsCode}\n` + program
    }
  }
  return requiredModules + program
}
