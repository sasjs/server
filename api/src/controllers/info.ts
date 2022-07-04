import { Route, Tags, Example, Get } from 'tsoa'
import { getAuthorizedRoutes } from '../utils'
export interface AuthorizedRoutesResponse {
  URIs: string[]
}

export interface InfoResponse {
  mode: string
  cors: string
  whiteList: string[]
  protocol: string
  runTimes: string[]
}

@Route('SASjsApi/info')
@Tags('Info')
export class InfoController {
  /**
   * @summary Get server info (mode, cors, whiteList, protocol).
   *
   */
  @Example<InfoResponse>({
    mode: 'desktop',
    cors: 'enable',
    whiteList: ['http://example.com', 'http://example2.com'],
    protocol: 'http',
    runTimes: ['sas', 'js']
  })
  @Get('/')
  public info(): InfoResponse {
    const response = {
      mode: process.env.MODE ?? 'desktop',
      cors:
        process.env.CORS ||
        (process.env.MODE === 'server' ? 'disable' : 'enable'),
      whiteList:
        process.env.WHITELIST?.split(' ')?.filter((url) => !!url) ?? [],
      protocol: process.env.PROTOCOL ?? 'http',
      runTimes: process.runTimes
    }
    return response
  }

  /**
   * @summary Get authorized routes.
   *
   */
  @Example<AuthorizedRoutesResponse>({
    URIs: ['/AppStream', '/SASjsApi/stp/execute']
  })
  @Get('/authorizedRoutes')
  public authorizedRoutes(): AuthorizedRoutesResponse {
    const response = {
      URIs: getAuthorizedRoutes()
    }
    return response
  }
}
