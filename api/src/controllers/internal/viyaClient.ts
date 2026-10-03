import SASjs from '@sasjs/adapter/node'
import { ServerType } from '@sasjs/utils/types'

/**
 * Executes SAS programs on a remote SAS Viya compute server.
 *
 * The server authenticates to Viya as a single service account (VIYA_USER /
 * VIYA_PASSWORD, OAuth2 password grant against the built-in `sas.cli` public
 * client) and submits each program to a compute session on VIYA_CONTEXT. The
 * @sasjs/adapter manages the compute session pool, submits the code, and reads
 * the session log and the program's `_webout` content back - the same contract
 * the local `sas` runtime fulfils with a local binary and a shared filesystem.
 */

/**
 * The pre-registered, secret-less OAuth client that ships with every SAS Viya
 * deployment. Using it means the runtime needs no admin-registered OAuth client
 * - only a local/LDAP service account with access to VIYA_CONTEXT.
 */
const SAS_CLI_CLIENT_ID = 'sas.cli'

interface ViyaAuth {
  access_token: string
  refresh_token: string
  client: string
  secret: string
}

let cachedAuth: ViyaAuth | undefined
let client: SASjs | undefined

/** Drops the cached access token, forcing a fresh password grant on next use. */
export const resetViyaAuth = () => {
  cachedAuth = undefined
}

/**
 * Whether a failure is the token's rather than the program's.
 *
 * The adapter reports a refused token as a 401/403 from the compute API, which
 * reaches here either as a status on the error or inside its message.
 */
const looksLikeAuthFailure = (err: any): boolean => {
  const status = err?.status ?? err?.statusCode ?? err?.response?.status
  if (status === 401 || status === 403) return true

  return /\b401\b|\b403\b|unauthori[sz]ed|forbidden|invalid[_ ]?token|token[^.]{0,40}expired/i.test(
    String(err?.message ?? '')
  )
}

const getViyaUrl = (): string => {
  const url = process.env.VIYA_URL

  if (!url) throw new Error('VIYA_URL is not set')

  return url.replace(/\/+$/, '')
}

const getViyaContext = (): string =>
  process.env.VIYA_CONTEXT || 'Compute Reusable'

const mintAccessToken = async (): Promise<ViyaAuth> => {
  const user = process.env.VIYA_USER
  const password = process.env.VIYA_PASSWORD

  if (!user || !password)
    throw new Error(
      'VIYA_USER and VIYA_PASSWORD are required for the sasviya runtime'
    )

  const basic = Buffer.from(`${SAS_CLI_CLIENT_ID}:`).toString('base64')

  const response = await fetch(`${getViyaUrl()}/SASLogon/oauth/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json'
    },
    body: new URLSearchParams({
      grant_type: 'password',
      username: user,
      password
    })
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')

    throw new Error(
      `Viya authentication failed (${response.status}) for user '${user}'. ` +
        `The password grant may be disabled for the '${SAS_CLI_CLIENT_ID}' client, ` +
        `or the credentials may be wrong. ${detail.slice(0, 200)}`
    )
  }

  const tokens = (await response.json()) as {
    access_token?: string
    refresh_token?: string
  }

  if (!tokens.access_token)
    throw new Error('The Viya token endpoint returned no access_token.')

  return {
    access_token: tokens.access_token,
    // Some Viya deployments omit refresh_token for the password grant.
    refresh_token: tokens.refresh_token ?? '',
    client: SAS_CLI_CLIENT_ID,
    secret: ''
  }
}

const getAuth = async (): Promise<ViyaAuth> => {
  if (!cachedAuth) cachedAuth = await mintAccessToken()

  return cachedAuth
}

const getClient = (): SASjs => {
  client =
    client ||
    new SASjs({
      serverUrl: getViyaUrl(),
      serverType: ServerType.SasViya,
      contextName: getViyaContext()
    })

  return client
}

export interface ViyaExecutionResult {
  webout: string
  log: string
}

/**
 * Runs a program on Viya and returns its log and `_webout` content.
 *
 * @param program - the full SAS program, including the preamble the server
 * injects. The program writes its response with `%mv_webout`.
 * @param jobName - a name for the submitted job, used for logs and diagnostics.
 */
const runProgram = async (
  program: string,
  jobName: string
): Promise<ViyaExecutionResult> => {
  const authConfig = await getAuth()

  try {
    // The public SASjs.executeScript() submits the code but does not return the
    // _webout fileref, so the compute client is used directly: debug=true relays
    // the log, expectWebout=true reads the session's _webout fileref.
    const result = await (getClient() as any).sasViyaApiClient.executeScript(
      jobName,
      program.split('\n'),
      getViyaContext(),
      authConfig,
      null, // data
      true, // debug - return the log
      true, // expectWebout - return the _webout content
      true, // waitForResult
      undefined, // pollOptions
      false, // printPid
      undefined, // variables
      (tokens: { access_token: string; refresh_token: string }) => {
        // Viya refresh tokens are single-use, so the rotated pair replaces the
        // cached one - otherwise the next refresh presents a spent token.
        cachedAuth = {
          ...authConfig,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token
        }
      }
    )

    // The adapter returns the _webout content as a string when the compute
    // session serves it as text, and as a parsed object when it serves it as
    // application/json - accept both rather than dropping the object case.
    const rawWebout = result?.result

    return {
      webout:
        typeof rawWebout === 'string'
          ? rawWebout
          : rawWebout === undefined || rawWebout === null
            ? ''
            : JSON.stringify(rawWebout),
      log: result?.log ?? ''
    }
  } catch (err: any) {
    // A job that fails carries its own log and IS a failure.
    if (err?.name === 'ComputeJobExecutionError') {
      throw new Error(`${err.message}\n${err.log ?? ''}`)
    }

    // A successful program that writes no _webout leaves the fileref fetch with
    // a 404, which the adapter surfaces as { status: 500, log }. That is an
    // empty webout, not a failed run - the log is the proof the job completed.
    if (err && typeof err === 'object' && err.log !== undefined) {
      return { webout: '', log: err.log ?? '' }
    }

    throw err
  }
}

/**
 * Runs a program on Viya, minting a fresh token once if the cached one is
 * refused.
 *
 * The cached pair can become unusable without the process dying: the access
 * token expires and the refresh token that would replace it is single-use and
 * already spent, so every later request is refused until the process restarts.
 * One more password grant is the way back, so the cache is dropped and the job
 * retried once rather than failing every caller from then on.
 */
export const executeViyaProgram = async (
  program: string,
  jobName: string
): Promise<ViyaExecutionResult> => {
  try {
    return await runProgram(program, jobName)
  } catch (err) {
    if (!looksLikeAuthFailure(err)) throw err

    resetViyaAuth()

    return runProgram(program, jobName)
  }
}
