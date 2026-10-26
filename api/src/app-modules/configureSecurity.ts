import { Express, NextFunction, Request, Response } from 'express'
import { getEnvCSPDirectives } from '../utils/parseHelmetConfig'
import { HelmetCoepType } from '../utils'
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
  if (req.secure) return next()

  const original = res.setHeader.bind(res)

  res.setHeader = ((name: string, value: number | string | string[]) => {
    if (String(name).toLowerCase() === 'content-security-policy')
      value = String(value).replace(/;?\s*upgrade-insecure-requests\b/g, '')

    return original(name, value)
  }) as typeof res.setHeader

  next()
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
