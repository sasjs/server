import os from 'os'

export enum MOCK_SERVERTYPEType {
  SAS9 = 'sas9',
  SASVIYA = 'sasviya'
}

export enum ModeType {
  Server = 'server',
  Desktop = 'desktop'
}

export enum AuthProviderType {
  LDAP = 'ldap',
  OIDC = 'oidc'
}

export enum ProtocolType {
  HTTP = 'http',
  HTTPS = 'https'
}

export enum CorsType {
  ENABLED = 'enable',
  DISABLED = 'disable'
}

export enum HelmetCoepType {
  TRUE = 'true',
  FALSE = 'false'
}

export enum LOG_FORMAT_MORGANType {
  Combined = 'combined',
  Common = 'common',
  Dev = 'dev',
  Short = 'short',
  tiny = 'tiny'
}

export enum RunTimeType {
  SAS = 'sas',
  JS = 'js',
  PY = 'py',
  R = 'r'
}

export enum ReturnCode {
  Success,
  InvalidEnv
}

export enum DatabaseType {
  MONGO = 'mongodb',
  COSMOS_MONGODB = 'cosmos_mongodb'
}

export enum ResetAdminPasswordType {
  YES = 'YES',
  NO = 'NO'
}

export enum OidcSigningAlg {
  RS256 = 'RS256',
  RS384 = 'RS384',
  RS512 = 'RS512',
  ES256 = 'ES256',
  ES384 = 'ES384',
  ES512 = 'ES512',
  EdDSA = 'EdDSA'
}

/**
 * AUTH_PROVIDERS is a list, not a single value - it is documented as
 * space-separated, and an install may legitimately run more than one provider
 * at once (eg LDAP for directory users plus OIDC for single sign-on). Commas
 * are accepted as well because they are the natural thing to type.
 *
 * Anything unrecognised is rejected by verifyMODE, so this can be permissive
 * about the separator without silently ignoring a typo.
 */
export const getAuthProviders = (): string[] =>
  (process.env.AUTH_PROVIDERS ?? '')
    .trim()
    .split(/[\s,]+/)
    .filter((provider) => !!provider)
    .map((provider) => provider.toLowerCase())

export const isAuthProviderEnabled = (provider: AuthProviderType): boolean =>
  getAuthProviders().includes(provider)

/**
 * Local sign-in is the database-account path: the password is compared against
 * the bcrypt hash on the user record. A deployment whose accounts all live in
 * an identity provider turns it off, which removes the one credential an
 * unauthenticated caller can attack directly (see LOCAL_LOGIN_ENABLED in the
 * README).
 *
 * Enabled unless explicitly switched off: a deployment that seeds a
 * break-glass admin with ADMIN_PASSWORD_INITIAL reaches it through this path,
 * and LDAP-verified sign-in is unaffected either way.
 */
export const isLocalLoginEnabled = (): boolean =>
  process.env.LOCAL_LOGIN_ENABLED !== 'false'

export const verifyEnvVariables = (): ReturnCode => {
  const errors: string[] = []

  errors.push(...verifyMOCK_SERVERTYPE())

  errors.push(...verifyMODE())

  errors.push(...verifyPROTOCOL())

  errors.push(...verifyPORT())
  errors.push(...verifyTrustProxy())

  errors.push(...verifyLoginThrottle())

  errors.push(...verifyLocalLogin())

  errors.push(...verifyCORS())

  errors.push(...verifyHELMET_COEP())

  errors.push(...verifyLOG_FORMAT_MORGAN())

  errors.push(...verifyRUN_TIMES())

  errors.push(...verifyExecutablePaths())

  errors.push(...verifyLDAPVariables())

  errors.push(...verifyOIDCVariables())

  errors.push(...verifyDbType())

  errors.push(...verifyAdminUserConfig())

  errors.push(...verifyRunAs())

  if (errors.length) {
    process.logger?.error(
      `Invalid environment variable(s) provided: \n${errors.join('\n')}`
    )
    return ReturnCode.InvalidEnv
  }

  return ReturnCode.Success
}

const verifyMOCK_SERVERTYPE = (): string[] => {
  const errors: string[] = []
  const { MOCK_SERVERTYPE, MODE } = process.env

  if (MOCK_SERVERTYPE) {
    const modeTypes = Object.values(MOCK_SERVERTYPEType)
    if (!modeTypes.includes(MOCK_SERVERTYPE as MOCK_SERVERTYPEType))
      errors.push(
        `- MOCK_SERVERTYPE '${MOCK_SERVERTYPE}'\n - valid options ${modeTypes}`
      )

    // The mock routers are served with NO authentication: they exist for
    // frontend development against canned responses. A server-mode deployment
    // with the variable set would expose /SASStoredProcess/* (and the mock
    // login) unauthenticated to anyone who can reach the app.
    if (MODE === ModeType.Server) {
      errors.push(
        `- MOCK_SERVERTYPE cannot be used in server mode: the mock routes are served without authentication. Unset it (or use MODE=desktop) and restart.`
      )
    }
  } else {
    // delete, not `= undefined`: assigning undefined to process.env stores the
    // STRING "undefined", so a second call to verifyEnvVariables in the same
    // process would then reject the value it set itself.
    delete process.env.MOCK_SERVERTYPE
  }

  return errors
}

const verifyMODE = (): string[] => {
  const errors: string[] = []
  const { MODE } = process.env

  if (MODE) {
    const modeTypes = Object.values(ModeType)
    if (!modeTypes.includes(MODE as ModeType))
      errors.push(`- MODE '${MODE}'\n - valid options ${modeTypes}`)
  } else {
    process.env.MODE = DEFAULTS.MODE
  }

  if (process.env.MODE === ModeType.Server) {
    const { DB_CONNECT, AUTH_PROVIDERS } = process.env

    if (process.env.NODE_ENV !== 'test') {
      if (!DB_CONNECT)
        errors.push(
          `- DB_CONNECT is required for PROTOCOL '${ModeType.Server}'`
        )

      if (AUTH_PROVIDERS) {
        const authProvidersType = Object.values(AuthProviderType)
        // Validate each entry of the list, not the raw string: a
        // space-separated list would otherwise never match a single enum
        // value and every multi-provider install would be rejected.
        getAuthProviders().forEach((provider) => {
          if (!authProvidersType.includes(provider as AuthProviderType))
            errors.push(
              `- AUTH_PROVIDERS '${provider}'\n - valid options ${authProvidersType}`
            )
        })
      }
    }
  }

  return errors
}

const verifyPROTOCOL = (): string[] => {
  const errors: string[] = []
  const { PROTOCOL } = process.env

  if (PROTOCOL) {
    const protocolTypes = Object.values(ProtocolType)
    if (!protocolTypes.includes(PROTOCOL as ProtocolType))
      errors.push(`- PROTOCOL '${PROTOCOL}'\n - valid options ${protocolTypes}`)
  } else {
    process.env.PROTOCOL = DEFAULTS.PROTOCOL
  }

  if (process.env.PROTOCOL === ProtocolType.HTTPS) {
    const { PRIVATE_KEY, CERT_CHAIN } = process.env

    if (!PRIVATE_KEY)
      errors.push(
        `- PRIVATE_KEY is required for PROTOCOL '${ProtocolType.HTTPS}'`
      )

    if (!CERT_CHAIN)
      errors.push(
        `- CERT_CHAIN is required for PROTOCOL '${ProtocolType.HTTPS}'`
      )
  }

  return errors
}

const verifyCORS = (): string[] => {
  const errors: string[] = []
  const { CORS } = process.env

  if (CORS) {
    const corsTypes = Object.values(CorsType)

    if (!corsTypes.includes(CORS as CorsType))
      errors.push(`- CORS '${CORS}'\n - valid options ${corsTypes}`)

    if (CORS === CorsType.ENABLED) {
      const { WHITELIST } = process.env

      const urls = WHITELIST?.trim()
        .split(' ')
        .filter((url) => !!url)
      if (urls?.length) {
        urls.forEach((url) => {
          if (!url.startsWith('http://') && !url.startsWith('https://'))
            errors.push(
              `- CORS '${CORS}'\n - provided WHITELIST ${url} is not valid`
            )
        })
      } else {
        errors.push(`- CORS '${CORS}'\n - provide at least one WHITELIST URL`)
      }
    }
  } else {
    const { MODE } = process.env
    process.env.CORS =
      MODE === ModeType.Server ? CorsType.DISABLED : CorsType.ENABLED
  }

  return errors
}

const verifyPORT = (): string[] => {
  const errors: string[] = []
  const { PORT } = process.env

  if (PORT) {
    if (Number.isNaN(parseInt(PORT)))
      errors.push(`- PORT '${PORT}'\n - should be a valid number`)
  } else {
    process.env.PORT = DEFAULTS.PORT
  }
  return errors
}

const verifyHELMET_COEP = (): string[] => {
  const errors: string[] = []
  const { HELMET_COEP } = process.env

  if (HELMET_COEP) {
    const helmetCoepTypes = Object.values(HelmetCoepType)
    if (!helmetCoepTypes.includes(HELMET_COEP as HelmetCoepType))
      errors.push(
        `- HELMET_COEP '${HELMET_COEP}'\n - valid options ${helmetCoepTypes}`
      )
    HELMET_COEP
  } else {
    process.env.HELMET_COEP = DEFAULTS.HELMET_COEP
  }
  return errors
}

const verifyLOG_FORMAT_MORGAN = (): string[] => {
  const errors: string[] = []
  const { LOG_FORMAT_MORGAN } = process.env

  if (LOG_FORMAT_MORGAN) {
    const logFormatMorganTypes = Object.values(LOG_FORMAT_MORGANType)
    if (
      !logFormatMorganTypes.includes(LOG_FORMAT_MORGAN as LOG_FORMAT_MORGANType)
    )
      errors.push(
        `- LOG_FORMAT_MORGAN '${LOG_FORMAT_MORGAN}'\n - valid options ${logFormatMorganTypes}`
      )
    LOG_FORMAT_MORGAN
  } else {
    process.env.LOG_FORMAT_MORGAN = DEFAULTS.LOG_FORMAT_MORGAN
  }
  return errors
}

const verifyRUN_TIMES = (): string[] => {
  const errors: string[] = []
  const { RUN_TIMES } = process.env

  if (RUN_TIMES) {
    const runTimes = RUN_TIMES.split(',')

    const runTimeTypes = Object.values(RunTimeType)

    runTimes.forEach((runTime) => {
      if (!runTimeTypes.includes(runTime as RunTimeType)) {
        errors.push(
          `- Invalid '${runTime}' runtime\n - valid options ${runTimeTypes}`
        )
      }
    })
  } else {
    process.env.RUN_TIMES = DEFAULTS.RUN_TIMES
  }
  return errors
}

const verifyExecutablePaths = (): string[] => {
  const errors: string[] = []
  const { RUN_TIMES, SAS_PATH, NODE_PATH, PYTHON_PATH, R_PATH, MODE } =
    process.env

  if (MODE === ModeType.Server) {
    const runTimes = RUN_TIMES?.split(',')

    if (runTimes?.includes(RunTimeType.SAS) && !SAS_PATH) {
      errors.push(`- SAS_PATH is required for ${RunTimeType.SAS} run time`)
    }

    if (runTimes?.includes(RunTimeType.JS) && !NODE_PATH) {
      errors.push(`- NODE_PATH is required for ${RunTimeType.JS} run time`)
    }

    if (runTimes?.includes(RunTimeType.PY) && !PYTHON_PATH) {
      errors.push(`- PYTHON_PATH is required for ${RunTimeType.PY} run time`)
    }

    if (runTimes?.includes(RunTimeType.R) && !R_PATH) {
      errors.push(`- R_PATH is required for ${RunTimeType.R} run time`)
    }
  }

  return errors
}

const verifyLDAPVariables = () => {
  const errors: string[] = []
  const {
    LDAP_URL,
    LDAP_BIND_DN,
    LDAP_BIND_PASSWORD,
    LDAP_USERS_BASE_DN,
    LDAP_GROUPS_BASE_DN,
    MODE
  } = process.env

  if (
    MODE === ModeType.Server &&
    isAuthProviderEnabled(AuthProviderType.LDAP)
  ) {
    if (!LDAP_URL) {
      errors.push(
        `- LDAP_URL is required for AUTH_PROVIDER '${AuthProviderType.LDAP}'`
      )
    }

    if (!LDAP_BIND_DN) {
      errors.push(
        `- LDAP_BIND_DN is required for AUTH_PROVIDER '${AuthProviderType.LDAP}'`
      )
    }

    if (!LDAP_BIND_PASSWORD) {
      errors.push(
        `- LDAP_BIND_PASSWORD is required for AUTH_PROVIDER '${AuthProviderType.LDAP}'`
      )
    }

    if (!LDAP_USERS_BASE_DN) {
      errors.push(
        `- LDAP_USERS_BASE_DN is required for AUTH_PROVIDER '${AuthProviderType.LDAP}'`
      )
    }

    if (!LDAP_GROUPS_BASE_DN) {
      errors.push(
        `- LDAP_GROUPS_BASE_DN is required for AUTH_PROVIDER '${AuthProviderType.LDAP}'`
      )
    }
  }

  return errors
}

/**
 * Validates the generic OpenID Connect relying-party settings.
 *
 * The provider is deliberately vendor-neutral: everything here is standard
 * OIDC plus a discovery document. A specific platform's variable names are a
 * documented mapping onto these, not a branch in the code.
 */
const verifyOIDCVariables = () => {
  const errors: string[] = []
  const {
    MODE,
    OIDC_ISSUER_URL,
    OIDC_DISCOVERY_URL,
    OIDC_CLIENT_ID,
    OIDC_CLIENT_SECRET,
    OIDC_REDIRECT_URI,
    OIDC_SIGNING_ALG,
    OIDC_SCOPE,
    OIDC_PROVIDER_NAME,
    OIDC_USERNAME_CLAIM,
    OIDC_JIT_PROVISION,
    OIDC_POST_LOGOUT_REDIRECT_URI
  } = process.env

  if (MODE !== ModeType.Server || !isAuthProviderEnabled(AuthProviderType.OIDC))
    return errors

  // OIDC_ISSUER_URL is deliberately not in this map - it is validated below,
  // where a discovery URL is accepted as an alternative to an issuer.
  const required: { [key: string]: string | undefined } = {
    OIDC_CLIENT_ID,
    OIDC_CLIENT_SECRET,
    OIDC_REDIRECT_URI
  }

  Object.entries(required).forEach(([name, value]) => {
    if (!value) {
      errors.push(
        `- ${name} is required for AUTH_PROVIDER '${AuthProviderType.OIDC}'`
      )
    }
  })

  // A discovery URL may be supplied instead of an issuer, but not neither.
  if (!OIDC_ISSUER_URL && !OIDC_DISCOVERY_URL) {
    errors.push(
      `- OIDC_ISSUER_URL (or OIDC_DISCOVERY_URL) is required for AUTH_PROVIDER '${AuthProviderType.OIDC}'`
    )
  }

  ;[OIDC_ISSUER_URL, OIDC_DISCOVERY_URL, OIDC_REDIRECT_URI].forEach((url) => {
    if (url && !isAbsoluteUrl(url)) {
      errors.push(`- OIDC URL '${url}' should be a valid absolute http(s) URL`)
    }
  })

  if (OIDC_SIGNING_ALG) {
    const algTypes = Object.values(OidcSigningAlg)
    if (!algTypes.includes(OIDC_SIGNING_ALG as OidcSigningAlg))
      errors.push(
        `- OIDC_SIGNING_ALG '${OIDC_SIGNING_ALG}'\n - valid options ${algTypes}`
      )
  } else {
    process.env.OIDC_SIGNING_ALG = DEFAULTS.OIDC_SIGNING_ALG
  }

  if (OIDC_SCOPE) {
    // Without the openid scope the response is not an OpenID Connect response
    // and there will be no id_token to verify.
    if (!OIDC_SCOPE.split(/[\s,]+/).includes('openid'))
      errors.push(`- OIDC_SCOPE '${OIDC_SCOPE}' must include 'openid'`)
  } else {
    process.env.OIDC_SCOPE = DEFAULTS.OIDC_SCOPE
  }

  if (!OIDC_PROVIDER_NAME)
    process.env.OIDC_PROVIDER_NAME = DEFAULTS.OIDC_PROVIDER_NAME

  if (!OIDC_USERNAME_CLAIM)
    process.env.OIDC_USERNAME_CLAIM = DEFAULTS.OIDC_USERNAME_CLAIM

  if (OIDC_JIT_PROVISION) {
    if (!isBoolean(OIDC_JIT_PROVISION))
      errors.push(
        `- OIDC_JIT_PROVISION '${OIDC_JIT_PROVISION}'\n - valid options true, false`
      )
  } else {
    process.env.OIDC_JIT_PROVISION = DEFAULTS.OIDC_JIT_PROVISION
  }

  if (
    OIDC_POST_LOGOUT_REDIRECT_URI &&
    !isAbsoluteUrl(OIDC_POST_LOGOUT_REDIRECT_URI)
  )
    errors.push(
      `- OIDC_POST_LOGOUT_REDIRECT_URI '${OIDC_POST_LOGOUT_REDIRECT_URI}' should be a valid absolute http(s) URL`
    )

  return errors
}

const verifyDbType = () => {
  const errors: string[] = []

  const { MODE, DB_TYPE } = process.env

  if (MODE === ModeType.Server) {
    if (DB_TYPE) {
      const dbTypes = Object.values(DatabaseType)
      if (!dbTypes.includes(DB_TYPE as DatabaseType))
        errors.push(`- DB_TYPE '${DB_TYPE}'\n - valid options ${dbTypes}`)
    } else {
      process.env.DB_TYPE = DEFAULTS.DB_TYPE
    }
  }

  return errors
}

const verifyAdminUserConfig = () => {
  const errors: string[] = []
  const { MODE, ADMIN_USERNAME, ADMIN_PASSWORD_INITIAL, ADMIN_PASSWORD_RESET } =
    process.env
  if (MODE === ModeType.Server) {
    if (ADMIN_USERNAME) {
      process.env.ADMIN_USERNAME = ADMIN_USERNAME.toLowerCase()
    } else {
      process.env.ADMIN_USERNAME = DEFAULTS.ADMIN_USERNAME
    }

    if (ADMIN_PASSWORD_INITIAL) {
      // Nothing to default: the operator provided the credential.
    } else if (process.env.NODE_ENV === 'test') {
      // Tests seed users explicitly; a hard requirement here would break
      // every spec that boots the app without an explicit admin password.
      process.env.ADMIN_PASSWORD_INITIAL = DEFAULTS.ADMIN_PASSWORD_INITIAL
    } else if (isAuthProviderEnabled(AuthProviderType.OIDC)) {
      // No local admin is seeded at all, and that is deliberate: the first
      // user to authenticate through the provider becomes the administrator
      // (resolveOidcUser), so a fresh install is usable without a credential
      // nobody can read. Set ADMIN_PASSWORD_INITIAL to seed a local
      // break-glass admin instead - which then also suppresses the bootstrap,
      // because that account is an admin from the first start.
      //
      // A default is deliberately NOT applied: a default would ship a
      // publicly-known credential as the deployment's admin in every
      // configuration that omits the variable.
      process.env.ADMIN_PASSWORD_INITIAL = ''
    } else {
      // Fail closed: with no external provider and no local admin there is no
      // account at all, so nobody - not even the operator - could sign in.
      errors.push(
        `- ADMIN_PASSWORD_INITIAL is required in server mode unless an external auth provider is enabled: without it no account exists and nobody can sign in. Set it, or enable AUTH_PROVIDERS='${AuthProviderType.OIDC}'.`
      )
    }

    if (ADMIN_PASSWORD_RESET) {
      const resetPasswordTypes = Object.values(ResetAdminPasswordType)
      if (
        !resetPasswordTypes.includes(
          ADMIN_PASSWORD_RESET as ResetAdminPasswordType
        )
      )
        errors.push(
          `- ADMIN_PASSWORD_RESET '${ADMIN_PASSWORD_RESET}'\n - valid options ${resetPasswordTypes}`
        )
    } else {
      process.env.ADMIN_PASSWORD_RESET = DEFAULTS.ADMIN_PASSWORD_RESET
    }
  }

  return errors
}

const isNumeric = (val: string): boolean => {
  return !isNaN(Number(val))
}

/**
 * TRUST_PROXY states how much of the X-Forwarded-* chain Express believes, and
 * it decides whether the session cookie is marked Secure on a site whose TLS
 * terminates at a proxy (see app.ts). Express accepts a boolean, a hop count or
 * a list of IPs/CIDRs and throws at startup on anything else - a confusing way
 * to learn about a typo, so the shape is checked here and reported with the
 * other environment errors.
 */
const verifyTrustProxy = (): string[] => {
  const errors: string[] = []
  const { TRUST_PROXY } = process.env

  if (!TRUST_PROXY) return errors
  if (['true', 'false'].includes(TRUST_PROXY)) return errors
  if (/^\d+$/.test(TRUST_PROXY)) return errors

  const addressOrCidr = /^[0-9a-fA-F:.]+(\/\d{1,3})?$/

  TRUST_PROXY.split(',').forEach((entry) => {
    const candidate = entry.trim()
    if (!candidate || !addressOrCidr.test(candidate)) {
      errors.push(
        `- TRUST_PROXY '${TRUST_PROXY}'\n - use true, false, a hop count, or a comma-separated list of IPs/CIDRs`
      )
    }
  })

  return errors
}

const verifyLoginThrottle = (): string[] => {
  const errors: string[] = []
  const { MAX_LOGIN_FAILURES, LOGIN_LOCKOUT_MINUTES } = process.env

  if (MAX_LOGIN_FAILURES !== undefined && !/^\d+$/.test(MAX_LOGIN_FAILURES)) {
    errors.push(
      `- MAX_LOGIN_FAILURES '${MAX_LOGIN_FAILURES}'\n - use a number of failed attempts`
    )
  }

  if (
    LOGIN_LOCKOUT_MINUTES !== undefined &&
    !/^\d+$/.test(LOGIN_LOCKOUT_MINUTES)
  ) {
    errors.push(
      `- LOGIN_LOCKOUT_MINUTES '${LOGIN_LOCKOUT_MINUTES}'\n - use a number of minutes`
    )
  }

  return errors
}

/**
 * LOCAL_LOGIN_ENABLED switches password sign-in for local (database) accounts
 * off, for deployments that authenticate everyone through a provider instead.
 * It is a boolean, and it cannot be switched off with no provider configured:
 * with the local path gone and nothing else to authenticate against, no
 * account could sign in at all.
 */
const verifyLocalLogin = (): string[] => {
  const errors: string[] = []
  const { LOCAL_LOGIN_ENABLED } = process.env

  if (LOCAL_LOGIN_ENABLED === undefined) return errors

  if (!isBoolean(LOCAL_LOGIN_ENABLED)) {
    errors.push(
      `- LOCAL_LOGIN_ENABLED '${LOCAL_LOGIN_ENABLED}'\n - use true or false`
    )
    return errors
  }

  if (LOCAL_LOGIN_ENABLED === 'false' && getAuthProviders().length === 0) {
    errors.push(
      `- LOCAL_LOGIN_ENABLED is false but AUTH_PROVIDERS is empty: no account could sign in. Enable a provider, or leave the local login enabled.`
    )
  }

  return errors
}

/**
 * The identity the server runs under is the privilege every connected user
 * gets, because this application executes uploaded code by design - and in
 * desktop mode there is no authentication at all. Root is refused unless
 * RUN_AS names an account explicitly.
 *
 * RUN_AS=root is the deliberate override. Any other value ASSERTS that the
 * process really is that account, so a mismatch is an error rather than a
 * silent downgrade: it is the operator's statement of intent, and a
 * deployment that quietly stopped honouring it would be worse than one that
 * refuses to start.
 *
 * POSIX only: Windows has no root and no uid, so the uid comparison is
 * skipped there and only the account name is checked.
 *
 * The effective uid is injectable so the spec can exercise the root branch
 * without running the suite as root.
 */
export const verifyRunAs = (
  euid: number | undefined = getEffectiveUid()
): string[] => {
  const errors: string[] = []

  // Unset and empty mean the same thing - no override - so an install that
  // writes `RUN_AS=` into config.env gets the default rather than a crash.
  // Both fail closed, because the default refuses root.
  const runAs = process.env.RUN_AS?.trim() || undefined

  if (!runAs) {
    if (euid === 0) {
      errors.push(
        `- running as root\n - set RUN_AS=<username> to name the account the server should run as, or RUN_AS=root to allow root deliberately`
      )
    }
    return errors
  }

  if (matchesCurrentAccount(runAs, euid)) return errors

  const advice =
    runAs === 'root'
      ? `start it as root, or drop RUN_AS to run as the current account`
      : `start it as '${runAs}', or set RUN_AS=root to allow root deliberately`

  errors.push(
    `- RUN_AS '${runAs}' but the server is running as '${currentAccount(
      euid
    )}'\n - ${advice}`
  )

  return errors
}

const getEffectiveUid = (): number | undefined =>
  typeof process.geteuid === 'function' ? process.geteuid() : undefined

const currentAccount = (euid: number | undefined): string => {
  const uid = euid ?? 'unknown'

  try {
    return `${os.userInfo().username} (uid ${uid})`
  } catch {
    return `uid ${uid}`
  }
}

const matchesCurrentAccount = (
  runAs: string,
  euid: number | undefined
): boolean => {
  if (euid !== undefined && String(euid) === runAs) return true

  // uid 0 IS root, whatever the account database says: a container can run as
  // root with no passwd entry to name it, and then userInfo() cannot confirm
  // it.
  if (euid === 0) return runAs === 'root'

  try {
    return os.userInfo().username === runAs
  } catch {
    return false
  }
}

const isAbsoluteUrl = (val: string): boolean => {
  try {
    const url = new URL(val)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

const isBoolean = (val: string): boolean => ['true', 'false'].includes(val)

const DEFAULTS = {
  MODE: ModeType.Desktop,
  PROTOCOL: ProtocolType.HTTP,
  PORT: '5000',
  HELMET_COEP: HelmetCoepType.TRUE,
  LOG_FORMAT_MORGAN: LOG_FORMAT_MORGANType.Common,
  RUN_TIMES: RunTimeType.SAS,
  DB_TYPE: DatabaseType.MONGO,
  ADMIN_USERNAME: 'secretuser',
  ADMIN_PASSWORD_INITIAL: 'secretpassword',
  ADMIN_PASSWORD_RESET: ResetAdminPasswordType.NO,
  OIDC_SIGNING_ALG: OidcSigningAlg.RS256,
  OIDC_SCOPE: 'openid profile email',
  OIDC_PROVIDER_NAME: 'OpenID Connect',
  // preferred_username is the standard claim for a human-readable login name;
  // sub is the fallback because some providers only return that. On Cloudron
  // the two are identical (sub IS the username).
  OIDC_USERNAME_CLAIM: 'preferred_username',
  OIDC_JIT_PROVISION: 'true'
}
