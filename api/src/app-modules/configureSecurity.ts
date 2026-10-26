import { Express } from 'express'
import { getEnvCSPDirectives } from '../utils/parseHelmetConfig'
import { HelmetCoepType, resolveListeners } from '../utils'
import helmet from 'helmet'

export const configureSecurity = (app: Express) => {
  const { HELMET_CSP_CONFIG_PATH, HELMET_COEP } = process.env

  const cspConfigJson: { [key: string]: string[] | null } = getEnvCSPDirectives(
    HELMET_CSP_CONFIG_PATH
  )
  // `upgrade-insecure-requests` rewrites http:// subresources to https://, which
  // breaks a client served over plain HTTP - so it is dropped whenever a plain
  // HTTP listener is enabled, whatever the TLS listener is doing.
  if (resolveListeners(process.env).config?.httpPort)
    cspConfigJson['upgrade-insecure-requests'] = null

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
