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

export enum RunTimeType {
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

  errors.push(...verifyRUN_TIMES())

  errors.push(...verifyExecutablePaths())

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
    const { DB_CONNECT } = process.env

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

const verifyExecutablePaths = () => {
  const errors: string[] = []
  const { RUN_TIMES, SAS_PATH, NODE_PATH, MODE } = process.env

  if (MODE === ModeType.Server) {
    const runTimes = RUN_TIMES?.split(',')

    if (runTimes?.includes(RunTimeType.SAS) && !SAS_PATH) {
      errors.push(`- SAS_PATH is required for ${RunTimeType.SAS} run time`)
    }

    if (runTimes?.includes(RunTimeType.JS) && !NODE_PATH) {
      errors.push(`- NODE_PATH is required for ${RunTimeType.JS} run time`)
    }
  }

  return errors
}

const DEFAULTS = {
  MODE: ModeType.Desktop,
  PROTOCOL: ProtocolType.HTTP,
  PORT: '5000',
  HELMET_COEP: HelmetCoepType.TRUE,
  LOG_FORMAT_MORGAN: LOG_FORMAT_MORGANType.Common,
  RUN_TIMES: RunTimeType.SAS
}
