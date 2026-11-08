import { Route, Tags, Example, Get, Request, Response, Security } from 'tsoa'
import express from 'express'
import User from '../model/User'
import {
  formatBuildInfo,
  getAuthorizedRoutes,
  getAuthProviders,
  getGrantedRoutes,
  isLocalLoginEnabled,
  resolveListeners
} from '../utils'
// The two enums this response states, imported from the module that defines
// them rather than through the barrel: `../utils/index` reaches these
// controllers through `isPublicRoute`, and a cycle leaves the enum undefined at
// decorator evaluation time, which fails the whole app at load.
import { CorsType, ModeType } from '../utils/verifyEnvVariables'
import { createInfoService } from '@sasjs/api'
export interface AuthorizedRoutesResponse {
  paths: string[]
}

export interface InfoResponse {
  /**
   * Which mode this server runs in, from `MODE` - and the two words it may be.
   * Typed as the enum rather than `string` so the published document states the
   * enum: a client comparing `mode`, or a host validating this answer, is
   * entitled to know that the value is one of two rather than any text. The
   * values are already constrained to these members by `verifyEnvVariables`,
   * which refuses the process at startup on anything else.
   */
  mode: ModeType
  /**
   * The CORS setting, from `CORS` - `enable` or `disable`, as the middleware
   * reads it. Same reasoning as `mode`: the value is an enum at runtime, so it
   * is stated as one rather than described in prose.
   */
  cors: CorsType
  /**
   * Port the plain HTTP listener serves on, or null when it is disabled.
   */
  httpPort: number | null
  /**
   * Port the TLS listener serves on, or null when it is disabled.
   */
  httpsPort: number | null
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
  /**
   * What produced this build, as `v3.2.2 (4a26a3d)` - the release tag and the
   * commit, from buildInfo.generated.ts. Public for the same reason as the rest
   * of this response: the interface stamps it in the corner of every screen,
   * the login screen included, so a support report names the build it came from
   * without anyone having to sign in first.
   */
  version: string
}

@Route('SASjsApi/info')
@Tags('Info')
export class InfoController {
  /**
   * Returns public information about this server instance: the mode it runs in
   * (`server` or `desktop`), its CORS setting, the ports its listeners serve on, the
   * available runtimes, the configured external authentication providers,
   * whether password sign-in for local accounts is enabled, and the release
   * that produced the running build.
   *
   * This endpoint requires no authentication: the login screen reads it to
   * decide which sign-in methods to offer.
   *
   * @summary Get public server information
   */
  @Example<InfoResponse>({
    mode: ModeType.Desktop,
    cors: CorsType.ENABLED,
    httpPort: 5000,
    httpsPort: 443,
    runTimes: ['sas', 'js'],
    authProviders: [],
    oidcProviderName: 'OpenID Connect',
    localLoginEnabled: true,
    version: 'v3.2.2 (4a26a3d)'
  })
  @Get('/')
  public async info(): Promise<InfoResponse> {
    const authProviders = getAuthProviders()
    const listeners = resolveListeners(process.env)
    const oidcProviderName = process.env.OIDC_PROVIDER_NAME

    // The shape, the two enums and the rule that the sign-on label only travels
    // with the provider that owns it are @sasjs/api's; this states the values.
    // The answer is validated before it is returned, so a deployment whose
    // environment slipped past verifyEnvVariables answers a 500 naming the field
    // rather than serving a body a client renders as undefined.
    const answer = await createInfoService(() => ({
      // both are constrained to their enum members by verifyEnvVariables, which
      // has already run by the time a request reaches here
      mode: (process.env.MODE as ModeType) ?? ModeType.Desktop,
      cors:
        (process.env.CORS as CorsType) ||
        (process.env.MODE === ModeType.Server
          ? CorsType.DISABLED
          : CorsType.ENABLED),
      httpPort: listeners.config?.httpPort || null,
      httpsPort: listeners.config?.httpsPort || null,
      runTimes: process.runTimes || [],
      authProviders,
      localLoginEnabled: isLocalLoginEnabled(),
      version: formatBuildInfo(),
      ...(oidcProviderName ? { oidcProviderName } : {})
    })).info()

    // the service answers the same shape in plain strings; the enums it enforced
    // are what this controller's type states
    return answer as InfoResponse
  }

  /**
   * Returns every route to which a permission rule can be applied. The
   * permissions dialog in the web interface uses this list to populate its
   * choices.
   *
   * The inventory is for the administration dialog, and it is **admin-only**:
   * the routes a caller may reach are reconnaissance before sign-in, so the
   * middleware refuses anyone else with a `401` before this method runs.
   *
   * @summary List the routes that accept permissions
   */
  @Example<AuthorizedRoutesResponse>({
    paths: ['/AppStream', '/SASjsApi/stp/execute']
  })
  @Response(401, 'Administrator access is required')
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
