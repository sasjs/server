import { getWeboutPrelude, weboutFinaliseStatement } from '@sasjs/utils'
import { PreProgramVars, Session } from '../../types'
import { generateFileUploadJSCode } from '../../utils'
import {
  asLiteral,
  partitionParameterNames,
  reportDroppedParameterNames
} from '../../utils/programVariables'
import { ExecutionVars } from './'

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

  const varStatments = safe.reduce(
    (computed: string, key: string) =>
      `${computed}const ${key} = ${asLiteral(vars[key])};\n`,
    ''
  )

  // webout() is generated into the program rather than required from a file,
  // which is how sasjs compile delivers the macros a SAS service declares: the
  // program is self-contained, and the session log shows exactly what ran. The
  // block is shared with the CLI's mock runtime, which cannot resolve a module
  // at all - @sasjs/utils owns the one copy.
  const weboutPrelude = getWeboutPrelude({
    weboutPath,
    headersPath,
    program: String(vars._program ?? ''),
    debug: String(vars._debug ?? ''),
    username: preProgramVariables?.username ?? '',
    userId: preProgramVariables?.userId ?? '',
    apiServerUrl:
      preProgramVariables?.localServerUrl ??
      preProgramVariables?.serverUrl ??
      ''
  })

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

${weboutPrelude}
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
${weboutFinaliseStatement}
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
