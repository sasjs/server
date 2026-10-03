import { Route, Tags, Example, Get, Request, Security } from 'tsoa'
import express from 'express'
import User from '../model/User'
import {
  getAuthorizedRoutes,
  getAuthProviders,
  getGrantedRoutes,
  isLocalLoginEnabled,
  ModeType
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
   * Returns public information about this server instance: the mode it runs in
   * (`server` or `desktop`), its CORS setting, the protocol it serves, the
   * available runtimes, the configured external authentication providers, and
   * whether password sign-in for local accounts is enabled.
   *
   * This endpoint requires no authentication: the login screen reads it to
   * decide which sign-in methods to offer.
   *
   * @summary Get public server information
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
   * Returns every route to which a permission rule can be applied. The
   * permissions dialog in the web interface uses this list to populate its
   * choices.
   *
   * @summary List the routes that accept permissions
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

  /**
   * Returns the routes this caller may use, taken from the routes that accept
   * permission rules. The web interface reads it to hide the parts of itself
   * the caller cannot use - the Studio tab, for example - rather than offering
   * an entry that only leads to a refusal.
   *
   * Administrators hold every route, because the permission rules do not apply
   * to them, and a public route is included for everyone. A `404` is returned
   * when the caller has no account.
   *
   * @summary List the routes this caller may use
   */
  @Example<AuthorizedRoutesResponse>({
    paths: ['/AppStream', '/SASjsApi/code/execute']
  })
  @Security('bearerAuth')
  @Get('/myAuthorizedRoutes')
  public async myAuthorizedRoutes(
    @Request() request: express.Request
  ): Promise<AuthorizedRoutesResponse> {
    // Desktop mode has no accounts and no permission model - one fixed user
    // holds everything - so every route is available. Answering 404 here left
    // the interface offering nothing at all in desktop mode, because the
    // routes it reads to decide what to show came back empty.
    if (process.env.MODE === ModeType.Desktop)
      return { paths: getAuthorizedRoutes() }

    const dbUser = await User.findOne({ _id: request.user?.userId })

    if (!dbUser)
      throw {
        code: 404,
        status: 'Not Found',
        message: 'User not found.'
      }

    return { paths: await getGrantedRoutes(dbUser) }
  }
}
