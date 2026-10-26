/**
 * Turns the listener environment variables into a validated configuration.
 *
 * Two ports, two listeners: `HTTP_PORT` and `HTTPS_PORT` each enable a listener
 * when they carry a value, and either can be used alone or both together. The
 * previous model had one listener and a `PROTOCOL` switch, which cannot express
 * "plain HTTP beside TLS" without encoding a bind policy into a variable name -
 * see the README.
 *
 * The function is pure: it reads the object it is given, returns the errors and
 * warnings rather than throwing or logging, and leaves `process.env` alone. That
 * is what lets every rule below be tested without starting a server.
 */

/** Addresses a plain HTTP listener may bind without an explicit opt-in. */
const LOOPBACK_ADDRESSES = new Set([
  '127.0.0.1',
  '::1',
  'localhost',
  '::ffff:127.0.0.1'
])

/** Where plain HTTP binds unless the operator widens it. */
export const DEFAULT_HTTP_BIND_ADDRESS = '127.0.0.1'

export interface ListenerConfig {
  /** Port for the plain HTTP listener, 0 when disabled. */
  httpPort: number
  /** Port for the TLS listener, 0 when disabled. */
  httpsPort: number
  /** Interface the plain HTTP listener binds to. */
  httpBindAddress: string
  /** Interface the TLS listener binds to, undefined for every interface. */
  httpsBindAddress?: string
}

export interface ListenerResolution {
  /** The configuration, or null when the environment is not usable. */
  config: ListenerConfig | null
  /** One line per problem, each naming the variable it is about. */
  errors: string[]
  /** Deprecation notices, one line per legacy variable in use. */
  warnings: string[]
}

type PortResult = { port: number } | { error: string }

/**
 * A port variable. Unset and empty both mean disabled, and so does `0`, so an
 * operator can turn a listener off without deleting the variable from a
 * deployment manifest.
 */
const parsePort = (name: string, raw: string | undefined): PortResult => {
  if (raw === undefined || raw.trim() === '') return { port: 0 }

  const value = raw.trim()

  if (!/^\d+$/.test(value))
    return { error: `- ${name} '${raw}'\n - should be a whole number` }

  const port = Number(value)

  if (port > 65535)
    return { error: `- ${name} '${raw}'\n - should be between 0 and 65535` }

  return { port }
}

const isSet = (value: string | undefined): boolean =>
  value !== undefined && value.trim() !== ''

const isLoopback = (address: string): boolean =>
  LOOPBACK_ADDRESSES.has(address.trim().toLowerCase())

/**
 * The one-release shim: `PROTOCOL` plus `PORT` are translated into the matching
 * port variable and reported as deprecated. The mapping is the one the migration
 * notes describe - `https` becomes `HTTPS_PORT`, `http` becomes `HTTP_PORT`, and
 * anything else is left to the caller to report.
 */
const translateLegacy = (
  env: NodeJS.ProcessEnv
): {
  httpPort?: string
  httpsPort?: string
  warnings: string[]
  errors: string[]
} => {
  const warnings: string[] = []
  const errors: string[] = []

  const legacySet = isSet(env.PROTOCOL) || isSet(env.PORT)

  if (isSet(env.HTTP_PORT) || isSet(env.HTTPS_PORT)) {
    // the new variables win, but say so: silently ignoring a PROTOCOL=https
    // leaves an operator believing a deployment is encrypted when the port
    // variable beside it says otherwise
    if (legacySet)
      warnings.push(
        '- PROTOCOL and PORT are ignored because HTTP_PORT or HTTPS_PORT is set\n - remove them so the deployment states its intent in one place'
      )

    return {
      httpPort: env.HTTP_PORT,
      httpsPort: env.HTTPS_PORT,
      warnings,
      errors
    }
  }

  const protocol = env.PROTOCOL?.trim().toLowerCase()
  // PORT carried a default of 5000 before the split, so PROTOCOL on its own must
  // keep meaning that transport on 5000 for the one release this shim exists
  const legacyPort = isSet(env.PORT) ? env.PORT : '5000'

  if (!protocol) {
    // nothing legacy in use at all: leave the refusal to the "no listener"
    // check, which names the variables an operator should set
    if (!legacySet) return { warnings, errors }

    errors.push(
      `- PORT is set but PROTOCOL is not, so the listener it described cannot be determined\n - set HTTP_PORT=${legacyPort} or HTTPS_PORT=${legacyPort} instead`
    )
    return { warnings, errors }
  }

  if (protocol === 'https') {
    warnings.push(
      `- PROTOCOL and PORT are deprecated, set HTTPS_PORT=${legacyPort} instead`
    )
    return { httpsPort: legacyPort, warnings, errors }
  }

  if (protocol === 'http') {
    warnings.push(
      `- PROTOCOL and PORT are deprecated, set HTTP_PORT=${legacyPort} instead`
    )
    return { httpPort: legacyPort, warnings, errors }
  }

  errors.push(
    `- PROTOCOL '${env.PROTOCOL}' is not a transport\n - valid options are 'http' and 'https'; set HTTP_PORT and/or HTTPS_PORT instead`
  )
  return { warnings, errors }
}

/**
 * Resolves and validates the listener configuration.
 *
 * @param env - the environment to read, `process.env` by default.
 * @returns the configuration, or the reasons it could not be built.
 */
export const resolveListeners = (
  env: NodeJS.ProcessEnv = process.env
): ListenerResolution => {
  const errors: string[] = []
  const legacy = translateLegacy(env)
  errors.push(...legacy.errors)

  const http = parsePort('HTTP_PORT', legacy.httpPort)
  const https = parsePort('HTTPS_PORT', legacy.httpsPort)

  if ('error' in http) errors.push(http.error)
  if ('error' in https) errors.push(https.error)

  if (errors.length) return { config: null, errors, warnings: legacy.warnings }

  const httpPort = (http as { port: number }).port
  const httpsPort = (https as { port: number }).port

  if (!httpPort && !httpsPort) {
    errors.push(
      '- no listener is enabled\n - set HTTP_PORT and/or HTTPS_PORT (either may be used alone)'
    )
    return { config: null, errors, warnings: legacy.warnings }
  }

  if (httpPort && httpsPort && httpPort === httpsPort) {
    errors.push(
      `- HTTP_PORT and HTTPS_PORT are both ${httpPort}\n - they must differ; two listeners cannot share a port`
    )
  }

  if (httpsPort && !isSet(env.CERT_CHAIN)) {
    errors.push(
      `- CERT_CHAIN is required when HTTPS_PORT is set\n - it was ${httpsPort}, so the TLS listener needs a certificate chain`
    )
  }

  if (httpsPort && !isSet(env.PRIVATE_KEY)) {
    errors.push(
      `- PRIVATE_KEY is required when HTTPS_PORT is set\n - it was ${httpsPort}, so the TLS listener needs a private key`
    )
  }

  const httpBindAddress =
    env.HTTP_BIND_ADDRESS?.trim() || DEFAULT_HTTP_BIND_ADDRESS

  if (
    httpPort &&
    !isLoopback(httpBindAddress) &&
    env.HTTP_ALLOW_REMOTE?.trim().toLowerCase() !== 'true'
  ) {
    errors.push(
      `- HTTP_BIND_ADDRESS '${httpBindAddress}' is not a loopback address\n - plain HTTP sends credentials in clear text; set HTTP_ALLOW_REMOTE=true only if that is intended`
    )
  }

  if (errors.length) return { config: null, errors, warnings: legacy.warnings }

  return {
    config: {
      httpPort,
      httpsPort,
      httpBindAddress,
      httpsBindAddress: env.HTTPS_BIND_ADDRESS?.trim() || undefined
    },
    errors,
    warnings: legacy.warnings
  }
}
