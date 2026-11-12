import { Express } from 'express'
import cors from 'cors'
import { CorsType, parseCorsWhiteList } from '../utils'

export const configureCors = (app: Express) => {
  const { CORS, WHITELIST } = process.env

  if (CORS === CorsType.ENABLED) {
    const { origins } = parseCorsWhiteList(WHITELIST)

    process.logger.info('All CORS Requests are enabled for:', origins)
    app.use(cors({ credentials: true, origin: origins }))
  }
}
