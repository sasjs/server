import { isWindows } from '@sasjs/utils'
import { PreProgramVars, Session } from '../../types'
import { generateFileUploadPythonCode } from '../../utils'
import { ExecutionVars } from './'

export const createPythonProgram = async (
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
    (computed: string, key: string) => `${computed}${key} = '${vars[key]}';\n`,
    ''
  )

  const preProgramVarStatments = `
_SASJS_SESSION_PATH = '${
    isWindows() ? session.path.replace(/\\/g, '\\\\') : session.path
  }';
_WEBOUT = '${isWindows() ? weboutPath.replace(/\\/g, '\\\\') : weboutPath}'; 
_SASJS_WEBOUT_HEADERS = '${headersPath}';
_SASJS_TOKENFILE = '${
    isWindows() ? tokenFile.replace(/\\/g, '\\\\') : tokenFile
  }';
_SASJS_USERNAME = '${preProgramVariables?.username}';
_SASJS_USERID = '${preProgramVariables?.userId}';
_SASJS_DISPLAYNAME = '${preProgramVariables?.displayName}';
_METAPERSON = _SASJS_DISPLAYNAME;
_METAUSER = _SASJS_USERNAME;
SASJSPROCESSMODE = 'Stored Program';
`

  const requiredModules = `import os`

  program = `
# runtime vars
${varStatments}

# dynamic user-provided vars
${preProgramVarStatments}

# change working directory to  session folder
os.chdir(_SASJS_SESSION_PATH)

# actual job code
${program}

`
  // if no files are uploaded filesNamesMap will be undefined
  if (otherArgs?.filesNamesMap) {
    const uploadJSCode = await generateFileUploadPythonCode(
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
