import { Route, Tags, Example, Get } from 'tsoa'
import {
  getAuthorizedRoutes,
  getAuthProviders,
  isLocalLoginEnabled
} from '../utils'
export interface AuthorizedRoutesResponse {
  paths: string[]
}

export interface InfoResponse {
  mode: string
  cors: string
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
  /**
   * Whether password sign-in for local (database) accounts is switched on,
   * from LOCAL_LOGIN_ENABLED. Public for the same reason as authProviders:
   * the login screen must not offer a form the server refuses to accept.
   */
  localLoginEnabled: boolean
}

@Route('SASjsApi/info')
@Tags('Info')
export class InfoController {
  /**
   * @summary Get server info (mode, cors, protocol).
   *
   */
  @Example<InfoResponse>({
    mode: 'desktop',
    cors: 'enable',
    protocol: 'http',
    runTimes: ['sas', 'js'],
    authProviders: [],
    oidcProviderName: 'OpenID Connect',
    localLoginEnabled: true
  })
  @Get('/')
  public info(): InfoResponse {
    const authProviders = getAuthProviders()

    const response: InfoResponse = {
      mode: process.env.MODE ?? 'desktop',
      cors:
        process.env.CORS ||
        (process.env.MODE === 'server' ? 'disable' : 'enable'),
      protocol: process.env.PROTOCOL ?? 'http',
      runTimes: process.runTimes,
      authProviders,
      localLoginEnabled: isLocalLoginEnabled()
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
