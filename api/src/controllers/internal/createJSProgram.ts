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

  // The shared prelude and upload bindings own these identifiers. Keep
  // colliding request fields in the context, but do not redeclare them. The
  // globalThis check below also protects runtime globals not in our list; that
  // fallback follows the server's Node version (the job may use NODE_PATH).
  // A static list alone can shadow a newly introduced global used by webout.
  const jsKeywords = new Set([
    'await',
    'break',
    'case',
    'catch',
    'class',
    'const',
    'continue',
    'debugger',
    'default',
    'delete',
    'do',
    'else',
    'enum',
    'export',
    'extends',
    'false',
    'finally',
    'for',
    'function',
    'if',
    'import',
    'in',
    'instanceof',
    'new',
    'null',
    'return',
    'super',
    'switch',
    'this',
    'throw',
    'true',
    'try',
    'typeof',
    'var',
    'void',
    'while',
    'with',
    'yield',
    'let',
    'static',
    'implements',
    'interface',
    'package',
    'private',
    'protected',
    'public'
  ])
  const runtimeNames = new Set([
    'require',
    'module',
    'exports',
    '__filename',
    '__dirname',
    'fs',
    'webout',
    '_webout',
    'weboutPath',
    '_SASJS_TOKENFILE',
    '_SASJS_WEBOUT_HEADERS',
    '_SASJS_APISERVERURL',
    '_SASJS_USERNAME',
    '_SASJS_USERID',
    '_SASJS_DISPLAYNAME',
    '_METAPERSON',
    '_METAUSER',
    'SASJSPROCESSMODE'
  ])
  const legacyNames = safe.filter(
    (key) =>
      !key.startsWith('_sasjs_') &&
      !key.startsWith('_WEBIN_') &&
      !jsKeywords.has(key) &&
      !runtimeNames.has(key) &&
      !(key in globalThis)
  )
  const legacyNameSet = new Set(legacyNames)
  reportDroppedParameterNames(
    safe.filter((key) => !legacyNameSet.has(key)),
    'js-legacy-collision'
  )
  const varStatments = legacyNames.reduce(
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
      '',
    // SAS reports the site as a global macro variable; a JS program has none, so
    // the site comes from this server's config. Unset - and empty or blank, which
    // is what a bare `SITE_ID=` in a .env file becomes - leaves it undefined, so
    // the prelude's default (123, the SASjs demo site) applies. Trimmed, because
    // a number copied with a trailing space is the same site.
    siteId: process.env.SITE_ID?.trim() || undefined
  })

  // Object.fromEntries preserves names such as __proto__ as ordinary own keys.
  // Parameter values use the same literal encoding as the legacy bindings.
  const fetchParams = safe
    .map((key) => {
      const value = vars[key]
      const literal = Array.isArray(value)
        ? `[${value.map(asLiteral).join(', ')}]`
        : asLiteral(value)
      return `[${asLiteral(key)}, ${literal}]`
    })
    .join(', ')

  const preProgramVarStatments = `
const _sasjs_fetch_context = { params: Object.fromEntries([${fetchParams}]), tables: ${otherArgs?.filesNamesMap ? '_sasjs_fetch_tables' : '[]'} };
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
  // Upload bindings are always present, including a zero count with no files.
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
  } else {
    program = `\nconst _WEBIN_FILE_COUNT = 0\n` + program
  }
  return requiredModules + program
}
