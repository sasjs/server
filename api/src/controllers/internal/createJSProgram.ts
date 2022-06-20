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
const _sasjs_tokenfile = '${tokenFile}';
const _sasjs_username = '${preProgramVariables?.username}';
const _sasjs_userid = '${preProgramVariables?.userId}';
const _sasjs_displayname = '${preProgramVariables?.displayName}';
const _metaperson = _sasjs_displayname;
const _metauser = _sasjs_username;
const sasjsprocessmode = 'Stored Program';
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
