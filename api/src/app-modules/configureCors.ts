import { Express } from 'express'
import cors from 'cors'
import { CorsType } from '../utils'

export const configureCors = (app: Express) => {
  const { CORS } = process.env

  if (CORS === CorsType.ENABLED) {
    const whiteList = getWhiteListed()

    console.log('All CORS Requests are enabled for:', whiteList)
    app.use(cors({ credentials: true, origin: whiteList }))
  }
}

export const getWhiteListed = (): string[] => {
  const whiteList: string[] = []
  const { CORS, WHITELIST } = process.env

  if (CORS === CorsType.ENABLED) {
    WHITELIST?.split(' ')
      ?.filter((url) => !!url)
      .forEach((url) => {
        if (url.startsWith('http'))
          // removing trailing slash of URLs listing for CORS
          whiteList.push(url.replace(/\/$/, ''))
      })
  }
  return whiteList
}
