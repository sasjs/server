import { PreProgramVars, Session } from '../../types'
import { generateFileUploadSasCode, getMacrosFolder } from '../../utils'
import { ExecutionVars } from './'

export const createSASProgram = async (
  program: string,
  preProgramVariables: PreProgramVars,
  vars: ExecutionVars,
  session: Session,
  weboutPath: string,
  tokenFile: string,
  otherArgs?: any
) => {
  const varStatments = Object.keys(vars).reduce(
    (computed: string, key: string) => `${computed}%let ${key}=${vars[key]};\n`,
    ''
  )

  const preProgramVarStatments = `
%let _sasjs_tokenfile=${tokenFile};
%let _sasjs_username=${preProgramVariables?.username};
%let _sasjs_userid=${preProgramVariables?.userId};
%let _sasjs_displayname=${preProgramVariables?.displayName};
%let _sasjs_apiserverurl=${preProgramVariables?.serverUrl};
%let _sasjs_apipath=/SASjsApi/stp/execute;
%let _sasjs_webout_headers=%sysfunc(pathname(work))/../stpsrv_header.txt;
%let _metaperson=&_sasjs_displayname;
%let _metauser=&_sasjs_username;

/* the below is here for compatibility and will be removed in a future release */
%let sasjs_stpsrv_header_loc=&_sasjs_webout_headers;

%let sasjsprocessmode=Stored Program;

%global SYSPROCESSMODE SYSTCPIPHOSTNAME SYSHOSTINFOLONG;
%macro _sasjs_server_init();
%if "&SYSPROCESSMODE"="" %then %let SYSPROCESSMODE=&sasjsprocessmode;
%if "&SYSTCPIPHOSTNAME"="" %then %let SYSTCPIPHOSTNAME=&_sasjs_apiserverurl;
%mend;
%_sasjs_server_init()

proc printto print="%sysfunc(getoption(log))";
run;
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
