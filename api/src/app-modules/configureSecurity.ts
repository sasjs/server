import { Express } from 'express'
import { getEnvCSPDirectives } from '../utils/parseHelmetConfig'
import { HelmetCoepType, ProtocolType } from '../utils'
import helmet from 'helmet'

export const configureSecurity = (app: Express) => {
  const { PROTOCOL, HELMET_CSP_CONFIG_PATH, HELMET_COEP } = process.env

  const cspConfigJson: { [key: string]: string[] | null } = getEnvCSPDirectives(
    HELMET_CSP_CONFIG_PATH
  )
  if (PROTOCOL === ProtocolType.HTTP)
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
