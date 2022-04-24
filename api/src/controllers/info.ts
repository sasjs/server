import { Route, Tags, Example, Get } from 'tsoa'

export interface InfoResponse {
  mode: string
  cors: string
  whiteList: string[]
  protocol: string
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
    protocol: 'http'
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
      protocol: process.env.PROTOCOL ?? 'http'
    }
    return response
  }
}
