/**
 * MODE must be in place before the app module loads: `setProcessVariables()`
 * only installs `process.secrets` in server mode, and the token this suite
 * mints is signed with `ACCESS_TOKEN_SECRET` from it.
 *
 * It lives in its own module because import statements are hoisted above the
 * other statements in a file, so setting it at the top of the spec would happen
 * after the app had already been imported. The spec imports this module first.
 */
process.env.MODE = 'server'
process.env.SAS_PATH = process.env.SAS_PATH || 'sas'
process.env.RUN_TIMES = process.env.RUN_TIMES || 'sas'

export {}
