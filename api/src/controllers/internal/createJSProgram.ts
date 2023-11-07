import { escapeWinSlashes } from '@sasjs/utils'
import { PreProgramVars, Session } from '../../types'
import { generateFileUploadJSCode } from '../../utils'
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
  const varStatments = Object.keys(vars).reduce(
    (computed: string, key: string) =>
      `${computed}const ${key} = \`${vars[key]}\`;\n`,
    ''
  )

  const preProgramVarStatments = `
let _webout = '';
const weboutPath = '${escapeWinSlashes(weboutPath)}'; 
const _SASJS_TOKENFILE = '${escapeWinSlashes(tokenFile)}';
const _SASJS_WEBOUT_HEADERS = '${escapeWinSlashes(headersPath)}';
const _SASJS_USERNAME = '${preProgramVariables?.username}';
const _SASJS_USERID = '${preProgramVariables?.userId}';
const _SASJS_DISPLAYNAME = '${preProgramVariables?.displayName}';
const _METAPERSON = _SASJS_DISPLAYNAME;
const _METAUSER = _SASJS_USERNAME;
const SASJSPROCESSMODE = 'Stored Program';
`

  const requiredModules = `const fs = require('fs')`

  program = `
/* runtime vars */
${varStatments}

/* dynamic user-provided vars */
${preProgramVarStatments}

/* actual job code */
${program}

/* write webout file only if webout exists*/
if (_webout) {
  fs.writeFile(weboutPath, _webout, function (err) {
    if (err) throw err;
  })
}
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
