export enum ModeType {
  Server = 'server',
  Desktop = 'desktop'
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

export enum SASJSRunTimes {
  SAS = 'sas',
  JS = 'js'
}

export enum ReturnCode {
  Success,
  InvalidEnv
}

export const verifyEnvVariables = (): ReturnCode => {
  const errors: string[] = []

  errors.push(...verifyMODE())

  errors.push(...verifyPROTOCOL())

  errors.push(...verifyPORT())

  errors.push(...verifyCORS())

  errors.push(...verifyHELMET_COEP())

  errors.push(...verifyLOG_FORMAT_MORGAN())

  errors.push(...verifySASJSRunTimes())

  if (errors.length) {
    process.logger?.error(
      `Invalid environment variable(s) provided: \n${errors.join('\n')}`
    )
    return ReturnCode.InvalidEnv
  }

  return ReturnCode.Success
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
    const {
      ACCESS_TOKEN_SECRET,
      REFRESH_TOKEN_SECRET,
      AUTH_CODE_SECRET,
      SESSION_SECRET,
      DB_CONNECT
    } = process.env

    if (!ACCESS_TOKEN_SECRET)
      errors.push(
        `- ACCESS_TOKEN_SECRET is required for PROTOCOL '${ModeType.Server}'`
      )

    if (!REFRESH_TOKEN_SECRET)
      errors.push(
        `- REFRESH_TOKEN_SECRET is required for PROTOCOL '${ModeType.Server}'`
      )

    if (!AUTH_CODE_SECRET)
      errors.push(
        `- AUTH_CODE_SECRET is required for PROTOCOL '${ModeType.Server}'`
      )

    if (!SESSION_SECRET)
      errors.push(
        `- SESSION_SECRET is required for PROTOCOL '${ModeType.Server}'`
      )

    if (process.env.NODE_ENV !== 'test')
      if (!DB_CONNECT)
        errors.push(
          `- DB_CONNECT is required for PROTOCOL '${ModeType.Server}'`
        )
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
    const { PRIVATE_KEY, FULL_CHAIN } = process.env

    if (!PRIVATE_KEY)
      errors.push(
        `- PRIVATE_KEY is required for PROTOCOL '${ProtocolType.HTTPS}'`
      )

    if (!FULL_CHAIN)
      errors.push(
        `- FULL_CHAIN is required for PROTOCOL '${ProtocolType.HTTPS}'`
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

const verifySASJSRunTimes = (): string[] => {
  const errors: string[] = []
  const { SASJS_RUNTIMES } = process.env

  if (SASJS_RUNTIMES) {
    const runTimes = SASJS_RUNTIMES.split(',').map((runTime) =>
      runTime.toLowerCase()
    )

    const possibleRunTimes = Object.values(SASJSRunTimes)

    runTimes.forEach((runTime) => {
      if (!possibleRunTimes.includes(runTime as SASJSRunTimes)) {
        errors.push(
          `- Invalid '${runTime}' runtime\n - valid options ${possibleRunTimes}`
        )
      }
    })
  } else {
    process.env.SASJS_RUNTIMES = DEFAULTS.SASJS_RUNTIMES
  }
  return errors
}

const DEFAULTS = {
  MODE: ModeType.Desktop,
  PROTOCOL: ProtocolType.HTTP,
  PORT: '5000',
  HELMET_COEP: HelmetCoepType.TRUE,
  LOG_FORMAT_MORGAN: LOG_FORMAT_MORGANType.Common,
  SASJS_RUNTIMES: SASJSRunTimes.SAS
}
