import path from 'path'
import express from 'express'
import { Request, Route, Tags, Post, Body, Get, Example } from 'tsoa'
import { readFile } from '@sasjs/utils'
import { randomBytes, timingSafeEqual } from 'crypto'

import User from '../model/User'
import Client from '../model/Client'
import {
  getWebBuildFolder,
  generateAuthCode,
  AuthProviderType,
  isAuthProviderEnabled,
  LDAPClient,
  OIDCClient,
  resolveOidcUser
} from '../utils'
import { InfoJWT } from '../types'
import { AuthController } from './auth'

@Route('/')
@Tags('Web')
export class WebController {
  /**
   * @summary Render index.html
   *
   */
  @Get('/')
  public async home() {
    return home()
  }

  /**
   * @summary Accept a valid username/password
   *
   */
  @Post('/SASLogon/login')
  public async login(
    @Request() req: express.Request,
    @Body() body: LoginPayload
  ) {
    return login(req, body)
  }

  /**
   * @summary Accept a valid username/password, plus a CLIENT_ID, and return an AUTH_CODE
   *
   */
  @Example<AuthorizeResponse>({
    code: 'someRandomCryptoString'
  })
  @Post('/SASLogon/authorize')
  public async authorize(
    @Request() req: express.Request,
    @Body() body: AuthorizePayload
  ): Promise<AuthorizeResponse> {
    return authorize(req, body.clientId)
  }

  /**
   * @summary Destroy the session stored in cookies
   *
   */
  @Get('/SASLogon/logout')
  public async logout(@Request() req: express.Request) {
    return new Promise((resolve) => {
      req.session.destroy(() => {
        resolve(true)
      })
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
  const content = await readFile(indexHtmlPath)

  return content
}

const login = async (
  req: express.Request,
  { username, password }: LoginPayload
) => {
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
    } else {
      validPass = user.comparePassword(password)
    }
  }

  if (!user) throw errors.userNotFound
  if (!validPass) throw errors.invalidPassword

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
 * Starts the authorization code flow: mint a state and a nonce, keep both
 * server-side against the session, and send the browser to the provider.
 */
const startOidc = async (req: express.Request): Promise<{ url: string }> => {
  const client = await OIDCClient.init()

  const state = randomBytes(32).toString('base64url')
  const nonce = randomBytes(32).toString('base64url')

  // The callback arrives as a GET from the provider, so it cannot carry a CSRF
  // token; `state` is what proves this callback belongs to a flow that this
  // browser session started.
  req.session.oidc = { state, nonce }

  return { url: client.getAuthorizationUrl(state, nonce) }
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
    throw errors.oidcInvalidState

  if (!query.code) throw errors.oidcMissingCode

  const client = await OIDCClient.init()

  let identity

  try {
    const tokens = await client.exchangeCodeForTokens(query.code)
    identity = await client.verifyIdToken(tokens.idToken, pending.nonce)
    req.session.oidcIdToken = tokens.idToken
  } catch (error) {
    // The provider's or the verifier's own words can describe token internals,
    // so they are logged rather than returned. A failed verification is an
    // authentication failure, not a server fault.
    process.logger?.error(`OIDC sign-in failed: ${(error as Error).message}`)
    throw errors.oidcVerificationFailed
  }

  const { user } = await resolveOidcUser(identity)

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

  await new Promise<void>((resolve) => req.session.destroy(() => resolve()))

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
  if (!userId) throw new Error('Invalid userId.')

  const client = await Client.findOne({ clientId })
  if (!client) throw new Error('Invalid clientId.')

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

const errors = {
  invalidPassword: {
    code: 401,
    message: 'Invalid Password.'
  },
  userNotFound: {
    code: 401,
    message: 'Username is not found.'
  },
  oidcInvalidState: {
    code: 401,
    message:
      'Invalid or expired OpenID Connect sign-in. Please start the sign-in again.'
  },
  oidcMissingCode: {
    code: 400,
    message:
      'The OpenID Connect callback did not include an authorization code.'
  },
  oidcVerificationFailed: {
    code: 401,
    message: 'OpenID Connect sign-in failed. Please try again.'
  },
  oidcProviderError: (error: string) => ({
    code: 401,
    message:
      error === 'access_denied'
        ? 'Sign-in was cancelled at the identity provider.'
        : 'The identity provider refused the sign-in request.'
  })
}
