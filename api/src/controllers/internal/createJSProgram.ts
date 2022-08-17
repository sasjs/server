import { isWindows } from '@sasjs/utils'
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
      `${computed}const ${key} = '${vars[key]}';\n`,
    ''
  )

  const preProgramVarStatments = `
let _webout = '';
const weboutPath = '${
    isWindows() ? weboutPath.replace(/\\/g, '\\\\') : weboutPath
  }'; 
const _SASJS_TOKENFILE = '${
    isWindows() ? tokenFile.replace(/\\/g, '\\\\') : tokenFile
  }';
const _SASJS_WEBOUT_HEADERS = '${headersPath}';
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
