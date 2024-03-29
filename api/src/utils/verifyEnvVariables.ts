export enum MOCK_SERVERTYPEType {
  SAS9 = 'sas9',
  SASVIYA = 'sasviya'
}

export enum ModeType {
  Server = 'server',
  Desktop = 'desktop'
}

export enum AuthProviderType {
  LDAP = 'ldap'
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

export const verifyEnvVariables = (): ReturnCode => {
  const errors: string[] = []

  errors.push(...verifyMOCK_SERVERTYPE())

  errors.push(...verifyMODE())

  errors.push(...verifyPROTOCOL())

  errors.push(...verifyPORT())

  errors.push(...verifyCORS())

  errors.push(...verifyHELMET_COEP())

  errors.push(...verifyLOG_FORMAT_MORGAN())

  errors.push(...verifyRUN_TIMES())

  errors.push(...verifyExecutablePaths())

  errors.push(...verifyLDAPVariables())

  errors.push(...verifyDbType())

  errors.push(...verifyRateLimiter())

  errors.push(...verifyAdminUserConfig())

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
  const { MOCK_SERVERTYPE } = process.env

  if (MOCK_SERVERTYPE) {
    const modeTypes = Object.values(MOCK_SERVERTYPEType)
    if (!modeTypes.includes(MOCK_SERVERTYPE as MOCK_SERVERTYPEType))
      errors.push(
        `- MOCK_SERVERTYPE '${MOCK_SERVERTYPE}'\n - valid options ${modeTypes}`
      )
  } else {
    process.env.MOCK_SERVERTYPE = undefined
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
        if (!authProvidersType.includes(AUTH_PROVIDERS as AuthProviderType))
          errors.push(
            `- AUTH_PROVIDERS '${AUTH_PROVIDERS}'\n - valid options ${authProvidersType}`
          )
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
    MODE,
    AUTH_PROVIDERS
  } = process.env

  if (MODE === ModeType.Server && AUTH_PROVIDERS === AuthProviderType.LDAP) {
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

const verifyRateLimiter = () => {
  const errors: string[] = []
  const {
    MODE,
    MAX_WRONG_ATTEMPTS_BY_IP_PER_DAY,
    MAX_CONSECUTIVE_FAILS_BY_USERNAME_AND_IP
  } = process.env
  if (MODE === ModeType.Server) {
    if (MAX_WRONG_ATTEMPTS_BY_IP_PER_DAY) {
      if (
        !isNumeric(MAX_WRONG_ATTEMPTS_BY_IP_PER_DAY) ||
        Number(MAX_WRONG_ATTEMPTS_BY_IP_PER_DAY) < 1
      ) {
        errors.push(
          `- Invalid value for 'MAX_WRONG_ATTEMPTS_BY_IP_PER_DAY' - Only positive number is acceptable`
        )
      }
    } else {
      process.env.MAX_WRONG_ATTEMPTS_BY_IP_PER_DAY =
        DEFAULTS.MAX_WRONG_ATTEMPTS_BY_IP_PER_DAY
    }

    if (MAX_CONSECUTIVE_FAILS_BY_USERNAME_AND_IP) {
      if (
        !isNumeric(MAX_CONSECUTIVE_FAILS_BY_USERNAME_AND_IP) ||
        Number(MAX_CONSECUTIVE_FAILS_BY_USERNAME_AND_IP) < 1
      ) {
        errors.push(
          `- Invalid value for 'MAX_CONSECUTIVE_FAILS_BY_USERNAME_AND_IP' - Only positive number is acceptable`
        )
      }
    } else {
      process.env.MAX_CONSECUTIVE_FAILS_BY_USERNAME_AND_IP =
        DEFAULTS.MAX_CONSECUTIVE_FAILS_BY_USERNAME_AND_IP
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

    if (!ADMIN_PASSWORD_INITIAL)
      process.env.ADMIN_PASSWORD_INITIAL = DEFAULTS.ADMIN_PASSWORD_INITIAL

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

const DEFAULTS = {
  MODE: ModeType.Desktop,
  PROTOCOL: ProtocolType.HTTP,
  PORT: '5000',
  HELMET_COEP: HelmetCoepType.TRUE,
  LOG_FORMAT_MORGAN: LOG_FORMAT_MORGANType.Common,
  RUN_TIMES: RunTimeType.SAS,
  DB_TYPE: DatabaseType.MONGO,
  MAX_WRONG_ATTEMPTS_BY_IP_PER_DAY: '100',
  MAX_CONSECUTIVE_FAILS_BY_USERNAME_AND_IP: '10',
  ADMIN_USERNAME: 'secretuser',
  ADMIN_PASSWORD_INITIAL: 'secretpassword',
  ADMIN_PASSWORD_RESET: ResetAdminPasswordType.NO
}
