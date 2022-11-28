import { Express } from 'express'
import cors from 'cors'
import { CorsType } from '../utils'

export const configureCors = (app: Express) => {
  const { CORS, WHITELIST } = process.env

  if (CORS === CorsType.ENABLED) {
    const whiteList: string[] = []
    WHITELIST?.split(' ')
      ?.filter((url) => !!url)
      .forEach((url) => {
        if (url.startsWith('http'))
          // removing trailing slash of URLs listing for CORS
          whiteList.push(url.replace(/\/$/, ''))
      })

    process.logger.info('All CORS Requests are enabled for:', whiteList)
    app.use(cors({ credentials: true, origin: whiteList }))
  }
}
