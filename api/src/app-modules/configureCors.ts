import { Express } from 'express'
import cors from 'cors'
import { CorsType, getEffectiveCors, parseCorsWhiteList } from '../utils'

export const configureCors = (app: Express) => {
  if (getEffectiveCors() === CorsType.ENABLED) {
    const { origins } = parseCorsWhiteList(process.env.WHITELIST)

    process.logger.info('All CORS Requests are enabled for:', origins)
    app.use(cors({ credentials: true, origin: origins }))
  }
}
