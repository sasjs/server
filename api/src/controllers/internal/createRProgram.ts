import { PreProgramVars, Session } from '../../types'
import { generateFileUploadRCode } from '../../utils'
import {
  asLiteral,
  partitionParameterNames,
  reportDroppedParameterNames
} from '../../utils/programVariables'
import { ExecutionVars } from '.'

export const createRProgram = async (
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
      `${computed}.${key} <- ${asLiteral(vars[key])}\n`,
    ''
  )

  const preProgramVarStatments = `
._SASJS_SESSION_PATH <- ${asLiteral(session.path)};
._WEBOUT <- ${asLiteral(weboutPath)}; 
._SASJS_WEBOUT_HEADERS <- ${asLiteral(headersPath)};
._SASJS_TOKENFILE <- ${asLiteral(tokenFile)};
._SASJS_USERNAME <- ${asLiteral(preProgramVariables?.username)};
._SASJS_USERID <- ${asLiteral(preProgramVariables?.userId)};
._SASJS_DISPLAYNAME <- ${asLiteral(preProgramVariables?.displayName)};
._METAPERSON <- ._SASJS_DISPLAYNAME;
._METAUSER <- ._SASJS_USERNAME;
SASJSPROCESSMODE <- 'Stored Program';
`

  const requiredModules = ``

  program = `
# runtime vars
${varStatments}

# dynamic user-provided vars
${preProgramVarStatments}

# change working directory to  session folder
setwd(._SASJS_SESSION_PATH)

# actual job code
${program}

`
  // if no files are uploaded filesNamesMap will be undefined
  if (otherArgs?.filesNamesMap) {
    const uploadRCode = await generateFileUploadRCode(
      otherArgs.filesNamesMap,
      session.path
    )

    // If any files are uploaded, the program needs to be updated with some
    // dynamically generated variables (pointers) for ease of ingestion
    if (uploadRCode.length > 0) {
      program = `${uploadRCode}\n` + program
    }
  }
  return requiredModules + program
}
