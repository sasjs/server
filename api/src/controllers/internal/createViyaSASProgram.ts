import { PreProgramVars } from '../../types'
import {
  asSasMacroValue,
  partitionParameterNames,
  reportDroppedParameterNames
} from '../../utils/programVariables'
import { ExecutionVars } from './'

/**
 * Builds the program submitted to Viya.
 *
 * Unlike createSASProgram this preamble does not touch the filesystem: there is
 * no local session folder on the compute server, so `_webout` is left to the
 * program itself (via `%mv_webout`) and no SASAUTOS/header paths are injected.
 * The macros the program calls must already exist on the Viya estate.
 */
export const createViyaSASProgram = async (
  program: string,
  preProgramVariables: PreProgramVars,
  vars: ExecutionVars,
  otherArgs?: any
) => {
  const { safe, dropped } = partitionParameterNames(vars)
  reportDroppedParameterNames(dropped)

  const varStatments = safe.reduce(
    (computed: string, key: string) =>
      `${computed}%let ${key}=${asSasMacroValue(vars[key])};\n`,
    ''
  )

  const preProgramVarStatments = `
%let _sasjs_username=${asSasMacroValue(preProgramVariables?.username)};
%let _sasjs_userid=${asSasMacroValue(preProgramVariables?.userId)};
%let _sasjs_displayname=${asSasMacroValue(preProgramVariables?.displayName)};
%let _sasjs_apiserverurl=${asSasMacroValue(preProgramVariables?.serverUrl)};
%let _sasjs_apipath=/SASjsApi/stp/execute;
%let _metaperson=&_sasjs_displayname;
%let _metauser=&_sasjs_username;

%let sasjsprocessmode=Stored Program;
`

  // NOTE: uploaded files are not relayed to Viya in this release - the upload
  // staging in otherArgs.filesNamesMap points at local server paths, which the
  // compute server cannot read.
  program = `
/* runtime vars */
${varStatments}

/* dynamic user-provided vars */
${preProgramVarStatments}

/* user autoexec starts */
${otherArgs?.userAutoExec ?? ''}
/* user autoexec ends */

/* actual job code */
${program}`

  return program
}
