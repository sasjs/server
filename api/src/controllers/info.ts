import { Route, Tags, Example, Get } from 'tsoa'
import { getAuthorizedRoutes, getAuthProviders } from '../utils'
export interface AuthorizedRoutesResponse {
  paths: string[]
}

export interface InfoResponse {
  mode: string
  cors: string
  whiteList: string[]
  protocol: string
  runTimes: string[]
  /**
   * Which external authentication providers are configured. Public, because
   * the login screen needs it before anyone is authenticated: it decides
   * whether to offer a single sign-on button.
   */
  authProviders: string[]
  /**
   * The label for that button, from OIDC_PROVIDER_NAME. Absent unless OIDC is
   * configured. Not sensitive - it is a display name.
   */
  oidcProviderName?: string
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
    runTimes: ['sas', 'js'],
    authProviders: [],
    oidcProviderName: 'OpenID Connect'
  })
  @Get('/')
  public info(): InfoResponse {
    const authProviders = getAuthProviders()

    const response: InfoResponse = {
      mode: process.env.MODE ?? 'desktop',
      cors:
        process.env.CORS ||
        (process.env.MODE === 'server' ? 'disable' : 'enable'),
      whiteList:
        process.env.WHITELIST?.split(' ')?.filter((url) => !!url) ?? [],
      protocol: process.env.PROTOCOL ?? 'http',
      runTimes: process.runTimes,
      authProviders
    }

    if (authProviders.includes('oidc'))
      response.oidcProviderName = process.env.OIDC_PROVIDER_NAME

    return response
  }

  /**
   * @summary Get the list of available routes to which permissions can be applied.  Used to populate the dialog in the URI Permissions feature.
   *
   */
  @Example<AuthorizedRoutesResponse>({
    paths: ['/AppStream', '/SASjsApi/stp/execute']
  })
  @Get('/authorizedRoutes')
  public authorizedRoutes(): AuthorizedRoutesResponse {
    const response = {
      paths: getAuthorizedRoutes()
    }
    return response
  }
}
