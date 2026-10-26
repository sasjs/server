import { Express, NextFunction, Request, Response } from 'express'
import { getEnvCSPDirectives } from '../utils/parseHelmetConfig'
import { HelmetCoepType, resolveListeners } from '../utils'
import helmet from 'helmet'

/**
 * `upgrade-insecure-requests` tells the browser to rewrite http:// subresources
 * as https://. It is right for a page served over TLS and wrong for one served
 * over plain HTTP, where it breaks every subresource the page loads.
 *
 * The decision therefore belongs to the request, not to the process: one express
 * app serves both listeners, so a process-wide switch would either break the
 * plain listener or weaken the TLS one.
 */
const stripUpgradeDirective = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!arrivedOverPlainListener(req)) return next()

  const original = res.setHeader.bind(res)

  // split on ';' and re-join: a regex that swallows the separators joins the
  // directives either side of the one being removed, and the browser then reads
  // them as one directive
  const strip = (value: string): string =>
    value
      .split(';')
      .map((directive) => directive.trim())
      .filter(
        (directive) => directive && directive !== 'upgrade-insecure-requests'
      )
      .join('; ')

  res.setHeader = ((name: string, value: number | string | string[]) => {
    if (String(name).toLowerCase() === 'content-security-policy')
      // helmet writes one string today; a list is handled element-wise so a
      // future multi-header policy is not silently joined into one value
      value = Array.isArray(value) ? value.map(strip) : strip(String(value))

    return original(name, value)
  }) as typeof res.setHeader

  next()
}

/**
 * Which listener served this request, from the socket rather than from
 * `req.secure`: `secure` is only true behind a proxy when TRUST_PROXY is set, and
 * making CSP depend on that would strip the directive from a TLS deployment that
 * simply has not configured it.
 */
const arrivedOverPlainListener = (req: Request): boolean => {
  const { config } = resolveListeners(process.env)

  // nothing readable: fall back to the connection's own view
  if (!config) return !req.secure

  if (config.httpPort && req.socket.localPort === config.httpPort) return true

  // with no TLS listener configured, whatever arrived here came over plain HTTP
  return !config.httpsPort
}

export const configureSecurity = (app: Express) => {
  const { HELMET_CSP_CONFIG_PATH, HELMET_COEP } = process.env

  const cspConfigJson: { [key: string]: string[] | null } = getEnvCSPDirectives(
    HELMET_CSP_CONFIG_PATH
  )

  // before helmet, so the write helmet makes passes through the wrapper
  app.use(stripUpgradeDirective)

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          ...cspConfigJson
        }
      },
      crossOriginEmbedderPolicy: HELMET_COEP === HelmetCoepType.TRUE
    })
  )
}
