import path from 'path'
import express from 'express'
import { SessionUserResponse } from './user'
import { Request, Route, Tags, Post, Body, Get, Example, Response } from 'tsoa'
import { randomBytes, timingSafeEqual } from 'crypto'

import User from '../model/User'
import Client from '../model/Client'
import {
  getWebBuildFolder,
  generateAuthCode,
  AuthProviderType,
  isAuthProviderEnabled,
  isLocalLoginEnabled,
  LDAPClient,
  OIDCClient,
  resolveOidcUser,
  webPageWithBundleVersion
} from '../utils'
import { InfoJWT } from '../types'
import { AuthController } from './auth'
// Imported from its own module rather than the barrel: the barrel reaches the
// controllers back through isPublicRoute, so a class read off it at module
// evaluation is still an unset binding.
import { HttpError } from '../utils/httpError'

@Route('/')
@Tags('Web')
export class WebController {
  /**
   * Serves the web interface's `index.html`, with the current bundle version
   * appended so a returning browser loads the updated bundle.
   *
   * @summary Serve the web interface
   */
  @Get('/')
  public async home() {
    return home()
  }

  /**
   * Signs a user in with a username and password and starts a session.
   *
   * Credentials are checked against the local database or, for an account that
   * authenticates through LDAP, against the directory. A `401` is returned for
   * unknown credentials, and also when password sign-in for local accounts is
   * disabled on the server.
   *
   * A `429` - the account is locked after repeated failures - carries a
   * `Retry-After` header in seconds, so a client can show a countdown without
   * parsing the message.
   *
   * @summary Sign in with a username and password
   */
  @Example<LoginResponse>({
    loggedIn: true,
    user: {
      uid: 'userIdString',
      username: 'johnusername',
      displayName: 'John',
      isAdmin: false,
      needsToUpdatePassword: false
    }
  })
  @Response(400, 'The request body is missing `username` or `password`')
  @Response(
    401,
    'The credentials are not valid, or password sign-in is disabled for local accounts'
  )
  @Response(429, 'Too many failed attempts for this account')
  @Response(500, 'An unexpected error occurred while signing in')
  @Post('/SASLogon/login')
  public async login(
    @Request() req: express.Request,
    @Body() body: LoginPayload
  ): Promise<LoginResponse> {
    return login(req, body)
  }

  /**
   * Issues a short-lived, single-use authorization code for the signed-in user
   * and the given client.
   *
   * The code is exchanged for tokens at `POST /SASjsApi/auth/token`. A session
   * is required; an unknown client id is rejected.
   *
   * @summary Issue an authorization code
   */
  @Example<AuthorizeResponse>({
    code: 'someRandomCryptoString'
  })
  @Response(
    400,
    'The request body is missing `clientId`, or the CSRF token is missing or invalid'
  )
  @Response(401, 'No signed-in session')
  // 403 where POST /SASjsApi/auth/token answers 401 for the same condition: this
  // route requires a signed-in session, so the caller IS authenticated and the
  // unknown client is a permission problem, not a missing credential. Stated on
  // both so a client author does not have to read the two as an inconsistency.
  @Response(
    403,
    'The client id is unknown. This route runs under a signed-in session, so the caller is authenticated and an unknown client is refused as forbidden; the unauthenticated `POST /SASjsApi/auth/token` answers `401` for the same condition'
  )
  @Post('/SASLogon/authorize')
  public async authorize(
    @Request() req: express.Request,
    @Body() body: AuthorizePayload
  ): Promise<AuthorizeResponse> {
    return authorize(req, body.clientId)
  }

  /**
   * Ends the session held in the request cookie.
   *
   * The session is REPLACED rather than destroyed: the browser keeps its
   * cookies across a logout, so the route hands back a CSRF token bound to the
   * new session (see routes/web/web.ts). Destroying instead leaves the old
   * token in place, bound to a session the server no longer has, and the next
   * login is refused with `Invalid CSRF token!` (sasjs/server#304).
   *
   * @summary Sign out
   */
  @Response(500, 'The session store failed to replace the session')
  @Get('/SASLogon/logout')
  public async logout(@Request() req: express.Request) {
    return new Promise((resolve, reject) => {
      req.session.regenerate((err) => (err ? reject(err) : resolve(true)))
    })
  }

  /**
   * Begin the OpenID Connect authorization code flow. Not decorated for tsoa:
   * these are browser redirect endpoints, not JSON APIs, so they are not part
   * of the documented /SASjsApi surface.
   */
  public async startOidc(@Request() req: express.Request) {
    return startOidc(req)
  }

  /**
   * Complete the OpenID Connect authorization code flow.
   */
  public async oidcCallback(@Request() req: express.Request) {
    return oidcCallback(req)
  }

  /**
   * Local logout plus, when the provider supports it, a redirect to its
   * end-session endpoint so the SSO session is closed too.
   */
  public async oidcLogout(@Request() req: express.Request) {
    return oidcLogout(req)
  }
}

const home = async () => {
  const indexHtmlPath = path.join(getWebBuildFolder(), 'index.html')

  // Attention! Cannot use fileExists here,
  // due to limitation after building executable
  return webPageWithBundleVersion(indexHtmlPath)
}

const login = async (
  req: express.Request,
  { username, password }: LoginPayload
): Promise<LoginResponse> => {
  // Authenticate User
  const user = await User.findOne({ username })

  let validPass = false

  if (user) {
    if (
      isAuthProviderEnabled(AuthProviderType.LDAP) &&
      user.authProvider === AuthProviderType.LDAP
    ) {
      const ldapClient = await LDAPClient.init()
      validPass = await ldapClient
        .verifyUser(username, password)
        .catch(() => false)
    } else if (!isLocalLoginEnabled()) {
      // The operator has switched local sign-in off, so the stored password is
      // never compared: there is no credential here to attack. Accounts that
      // authenticate through LDAP keep working, and provider accounts sign in
      // through the provider.
      throw errors.localLoginDisabled()
    } else {
      validPass = user.comparePassword(password)
    }
  }

  if (!user) throw errors.userNotFound()
  if (!validPass) throw errors.invalidPassword()

  req.session.loggedIn = true
  req.session.user = {
    userId: user.uid,
    clientId: 'web_app',
    username: user.username,
    displayName: user.displayName,
    isAdmin: user.isAdmin,
    isActive: user.isActive,
    autoExec: user.autoExec,
    needsToUpdatePassword: user.needsToUpdatePassword
  }

  return {
    loggedIn: true,
    user: {
      uid: user.uid,
      username: user.username,
      displayName: user.displayName,
      isAdmin: user.isAdmin,
      needsToUpdatePassword: user.needsToUpdatePassword
    }
  }
}

/**
 * Starts the authorization code flow: mint a state, a nonce and a PKCE code
 * verifier, keep all three server-side against the session, and send the
 * browser to the provider.
 */
const startOidc = async (req: express.Request): Promise<{ url: string }> => {
  const client = await OIDCClient.init()

  const state = randomBytes(32).toString('base64url')
  const nonce = randomBytes(32).toString('base64url')
  const codeVerifier = randomBytes(32).toString('base64url')

  // The callback arrives as a GET from the provider, so it cannot carry a CSRF
  // token; `state` is what proves this callback belongs to a flow that this
  // browser session started.
  req.session.oidc = { state, nonce, codeVerifier }

  return { url: client.getAuthorizationUrl(state, nonce, codeVerifier) }
}

/**
 * Completes the flow: validate the state, exchange the code, verify the
 * id_token, resolve the local user, then establish the session.
 */
const oidcCallback = async (req: express.Request): Promise<{ url: string }> => {
  const query = req.query as {
    code?: string
    state?: string
    error?: string
    error_description?: string
  }

  // The provider reports a refusal (user cancelled, consent withheld) as an
  // error parameter on the callback rather than an HTTP error. The description
  // is provider-controlled free text, so it is logged rather than reflected
  // into the response.
  if (query.error) {
    process.logger?.error(
      `OIDC sign-in refused by the provider: ${query.error}${
        query.error_description ? ` - ${query.error_description}` : ''
      }`
    )
    throw errors.oidcProviderError(query.error)
  }

  const pending = req.session.oidc

  // Single use: cleared before anything else can fail, so a replayed callback
  // finds no state to match.
  delete req.session.oidc

  if (!pending || !query.state || !safeEqual(query.state, pending.state))
    throw errors.oidcInvalidState()

  if (!query.code) throw errors.oidcMissingCode()

  const client = await OIDCClient.init()

  let identity

  try {
    const tokens = await client.exchangeCodeForTokens(
      query.code,
      pending.codeVerifier
    )
    identity = await client.verifyIdToken(
      tokens.idToken,
      pending.nonce,
      tokens.accessToken
    )
    req.session.oidcIdToken = tokens.idToken
  } catch (error) {
    // The provider's or the verifier's own words can describe token internals,
    // so they are logged rather than returned. A failed verification is an
    // authentication failure, not a server fault.
    process.logger?.error(`OIDC sign-in failed: ${(error as Error).message}`)
    throw errors.oidcVerificationFailed()
  }

  const { user } = await resolveOidcUser(
    identity,
    client.providerSupportsGroups()
  )

  req.session.loggedIn = true
  req.session.user = {
    userId: user.uid,
    clientId: 'web_app',
    username: user.username,
    displayName: user.displayName,
    isAdmin: user.isAdmin,
    isActive: user.isActive,
    autoExec: user.autoExec,
    needsToUpdatePassword: user.needsToUpdatePassword
  }

  return { url: '/' }
}

/**
 * Local logout, plus a redirect to the provider's end-session endpoint when it
 * advertises one.
 *
 * Deliberately a separate route from /SASLogon/logout: the SPA calls that one
 * with axios, so it must keep answering 200 - handing it a cross-origin
 * redirect would be followed as an XHR and fail. This route is meant to be
 * navigated to, not fetched.
 */
const oidcLogout = async (req: express.Request): Promise<{ url: string }> => {
  const idToken = req.session.oidcIdToken

  let endSessionUrl: string | undefined

  if (idToken && isAuthProviderEnabled(AuthProviderType.OIDC)) {
    endSessionUrl = await OIDCClient.init()
      .then((client) => client.getEndSessionUrl(idToken))
      // Logging out must not fail because the provider is unreachable - fall
      // back to clearing the local session only.
      .catch(() => undefined)
  }

  await new Promise<void>((resolve, reject) =>
    req.session.regenerate((err) => (err ? reject(err) : resolve()))
  )

  return { url: endSessionUrl ?? '/' }
}

/**
 * Constant-time string comparison. timingSafeEqual throws on differing lengths,
 * which would itself disclose the length, so lengths are compared first.
 */
const safeEqual = (a: string, b: string): boolean => {
  const bufferA = Buffer.from(a)
  const bufferB = Buffer.from(b)

  if (bufferA.length !== bufferB.length) return false

  return timingSafeEqual(bufferA, bufferB)
}

const authorize = async (
  req: express.Request,
  clientId: string
): Promise<AuthorizeResponse> => {
  const userId = req.session.user?.userId
  if (!userId) throw new HttpError(401, 'Invalid userId.')

  const client = await Client.findOne({ clientId })
  if (!client) throw new HttpError(403, 'Invalid clientId.')

  // generate authorization code against clientId
  const userInfo: InfoJWT = {
    clientId,
    userId
  }
  const code = AuthController.saveCode(
    userId,
    clientId,
    generateAuthCode(userInfo)
  )

  return { code }
}

export interface LoginResponse {
  loggedIn: boolean
  user: SessionUserResponse
}

interface LoginPayload {
  /**
   * Username for user
   * @example "secretuser"
   */
  username: string
  /**
   * Password for user
   * @example "secretpassword"
   */
  password: string
}

interface AuthorizePayload {
  /**
   * Client ID
   * @example "clientID1"
   */
  clientId: string
}

interface AuthorizeResponse {
  /**
   * Authorization code
   * @example "someRandomCryptoString"
   */
  code: string
}

/**
 * Each refusal is built where it is thrown, so the stack names the request that
 * refused rather than this module's evaluation: one shared instance per entry
 * would carry the module's stack on every request that threw it.
 */
const errors = {
  invalidPassword: () => new HttpError(401, 'Invalid Password.'),
  userNotFound: () => new HttpError(401, 'Username is not found.'),
  localLoginDisabled: () =>
    new HttpError(
      401,
      'Password sign-in is disabled for local accounts. Sign in with the configured identity provider.'
    ),
  oidcInvalidState: () =>
    new HttpError(
      401,
      'Invalid or expired OpenID Connect sign-in. Please start the sign-in again.'
    ),
  oidcMissingCode: () =>
    new HttpError(
      400,
      'The OpenID Connect callback did not include an authorization code.'
    ),
  oidcVerificationFailed: () =>
    new HttpError(401, 'OpenID Connect sign-in failed. Please try again.'),
  oidcProviderError: (error: string) =>
    new HttpError(
      401,
      error === 'access_denied'
        ? 'Sign-in was cancelled at the identity provider.'
        : 'The identity provider refused the sign-in request.'
    )
}
