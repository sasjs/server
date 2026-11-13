/**
 * `POST /SASLogon/oauth/token` - the estate's token port, answered by this server.
 *
 * A Viya client does not present a sasjs/server token; it asks for one the Viya
 * way. `@sasjs/adapter` and the CLI speak three grants, and all three are here:
 *
 * - `authorization_code` - the client signs a user in at `POST /SASLogon/login`
 *   (or the SPA does), takes the single-use code from `POST /SASLogon/authorize`
 *   as JSON or from the page `GET /SASLogon/oauth/authorize` renders for
 *   `@sasjs/adapter`, and exchanges it here with its client id and secret;
 * - `refresh_token` - the client rotates the pair it holds. The refresh token is
 *   single-use: the pair in the database is replaced, so a replayed one is
 *   refused, as it is on a real estate;
 * - `password` - the CLI's secret-less public client `sas.cli` against a local
 *   account, which is how a deployment with no registered client is reached.
 *
 * `client_credentials` is not answered, because no client this server serves
 * sends it - the CLI and the adapter carry no such call - and a grant nobody
 * makes is a grant nobody has proved.
 *
 * The credentials are the ones this server already holds: a registered `Client`
 * record's secret is checked, and the account is the local user (or the LDAP
 * account, when LDAP is enabled and the user is one). Nothing here mints an
 * `id_token`: an ID token is an assertion about an OpenID Connect identity, and
 * this estate answers "who is this" with `GET /identities/users/@currentUser`.
 */
import type { Request, Response } from 'express'
import express from 'express'
import multer from 'multer'
import { randomBytes } from 'crypto'
import jwt from 'jsonwebtoken'

import type { IUserDocument } from '../../model/User'
import Client, { NUMBER_OF_SECONDS_IN_A_DAY } from '../../model/Client'
import { AuthController } from '../../controllers/auth'
import {
  generateAccessToken,
  generateRefreshToken,
  getLoginLockoutRemaining,
  getStoredRefreshToken,
  getTokensFromDB,
  recordLoginFailure,
  resetLoginFailures,
  saveTokensInDB,
  verifyCredentials,
  WrongCredentials
} from '../../utils'
import { HttpError } from '../../utils/httpError'
import type { InfoJWT } from '../../types'

/** The one path this module answers. */
export const TOKEN_PATH = '/SASLogon/oauth/token'

/** The secret-less public client every Viya deployment ships, per the CLI. */
export const SAS_CLI_CLIENT_ID = 'sas.cli'

/**
 * The expirations a public client's tokens carry.
 *
 * `sas.cli` is not a `Client` record - a real estate has it without anyone
 * registering it - so it takes the defaults a record carries when a field is
 * left out.
 */
const PUBLIC_CLIENT_EXPIRATIONS = {
  accessTokenExpiration: NUMBER_OF_SECONDS_IN_A_DAY,
  refreshTokenExpiration: NUMBER_OF_SECONDS_IN_A_DAY * 30
}

/** A token pair, before it is written in the estate's answer shape. */
export interface TokenPair {
  accessToken: string
  refreshToken: string
  accessTokenExpiration: number
  refreshTokenExpiration: number
  jti: string
}

/** A refusal in the OAuth error shape, rather than this server's refusal shape. */
export class OAuthError extends Error {
  constructor(
    public status: number,
    public error: string,
    public description: string
  ) {
    super(description)

    // the prototype is set by hand because the compiled target predates classes:
    // without it `instanceof` is false for every instance, and the handler that
    // answers a refusal would rethrow it instead of answering
    Object.setPrototypeOf(this, OAuthError.prototype)
    this.name = 'OAuthError'
  }
}

const invalidClient = (description = 'Invalid client id or secret.') =>
  new OAuthError(401, 'invalid_client', description)

const invalidGrant = (description: string) =>
  new OAuthError(401, 'invalid_grant', description)

const invalidRequest = (description: string) =>
  new OAuthError(400, 'invalid_request', description)

/** The client id and secret a request carries, from Basic auth or the body. */
export const clientCredentialsOf = (
  req: Request,
  body: Record<string, string>
): { clientId: string; clientSecret: string } => {
  const header = req.headers.authorization ?? ''
  const basic = /^Basic\s+(.+)$/i.exec(header)

  if (basic) {
    const decoded = Buffer.from(basic[1], 'base64').toString('utf8')
    const separator = decoded.indexOf(':')

    if (separator !== -1)
      return {
        clientId: decoded.slice(0, separator),
        clientSecret: decoded.slice(separator + 1)
      }
  }

  return {
    clientId: body.client_id ?? '',
    clientSecret: body.client_secret ?? ''
  }
}

/**
 * The body, whichever of the three encodings a client used.
 *
 * The adapter posts the refresh grant as multipart and the other two as form
 * encoding, and a client that posts JSON should not be refused for it - so all
 * three are read here rather than trusting a parser mounted above, which would
 * have to be mounted for every route to be certain of reaching this one.
 */
export const parseTokenBody = async (
  req: Request,
  res: Response
): Promise<Record<string, string>> => {
  const run = (middleware: express.RequestHandler) =>
    new Promise<void>((resolve, reject) => {
      middleware(req, res, (error?: unknown) =>
        error ? reject(error) : resolve()
      )
    })

  if (req.is('multipart/form-data')) {
    // fields only: a token request carries no file, and `none()` refuses one
    await run(multer().none() as unknown as express.RequestHandler)
  } else if (req.is('application/x-www-form-urlencoded')) {
    await run(express.urlencoded({ extended: false }))
  } else if (req.is('application/json')) {
    await run(express.json())
  }

  const body = (req.body ?? {}) as Record<string, unknown>

  return Object.fromEntries(
    Object.entries(body).map(([key, value]) => [key, String(value ?? '')])
  )
}

/**
 * The account a password grant names.
 *
 * The lockout is the login form's, deliberately: without it this grant is a way
 * around the throttle that form enforces.
 */
const userForPasswordGrant = async (
  username: string,
  password: string
): Promise<IUserDocument> => {
  const locked = getLoginLockoutRemaining(username)

  if (locked > 0)
    throw new OAuthError(
      429,
      'temporarily_unavailable',
      `Too many failed attempts. Retry after ${locked} seconds.`
    )

  try {
    const user = await verifyCredentials(username, password)

    resetLoginFailures(username)

    return user
  } catch (error) {
    // only a credential that did not match is a failed sign-in: an LDAP outage or
    // local sign-in being switched off refuses the request without counting it,
    // or a correct password would walk the account toward the lockout
    if (error instanceof WrongCredentials) {
      recordLoginFailure(username)

      throw invalidGrant('Invalid username or password.')
    }

    if (error instanceof HttpError)
      throw new OAuthError(error.status, 'invalid_grant', error.message)

    throw error
  }
}

/** The registered client, with its secret checked. */
const registeredClient = async (clientId: string, clientSecret: string) => {
  const client = await Client.findOne({ clientId })

  // one description for both halves: RFC 6749 section 5.2 specifies a single
  // `invalid_client`, and telling a caller which half was wrong also tells them
  // whether an id is registered - the password grant already withholds that
  if (!client || client.clientSecret !== clientSecret) throw invalidClient()

  return client
}

const mint = async (
  userInfo: InfoJWT,
  expirations: { accessTokenExpiration: number; refreshTokenExpiration: number }
): Promise<TokenPair> => {
  // `jti` is what makes two pairs minted in the same second differ: the payload
  // is otherwise identical, and single-use rotation would answer with the token
  // it was asked to replace
  const jti = randomBytes(16).toString('hex')
  const withId = { ...userInfo, jti } as InfoJWT

  const accessToken = generateAccessToken(
    withId,
    expirations.accessTokenExpiration
  )
  const refreshToken = generateRefreshToken(
    withId,
    expirations.refreshTokenExpiration
  )

  await saveTokensInDB(
    userInfo.userId,
    userInfo.clientId,
    accessToken,
    refreshToken
  )

  return {
    accessToken,
    refreshToken,
    accessTokenExpiration: expirations.accessTokenExpiration,
    refreshTokenExpiration: expirations.refreshTokenExpiration,
    jti
  }
}

/** The expirations a client's tokens carry, with the public client's defaults. */
const expirationsOf = (client: {
  accessTokenExpiration?: number
  refreshTokenExpiration?: number
}) => ({
  accessTokenExpiration:
    client.accessTokenExpiration ??
    PUBLIC_CLIENT_EXPIRATIONS.accessTokenExpiration,
  refreshTokenExpiration:
    client.refreshTokenExpiration ??
    PUBLIC_CLIENT_EXPIRATIONS.refreshTokenExpiration
})

/** The code's claims, when it is one this server issued to this client. */
const verifyAuthCode = async (
  clientId: string,
  code: string
): Promise<InfoJWT | undefined> =>
  new Promise((resolve) => {
    jwt.verify(code, process.secrets.AUTH_CODE_SECRET, (error, data) => {
      if (error) return resolve(undefined)

      const payload = data as InfoJWT

      if (payload?.clientId === clientId)
        return resolve({ clientId: payload.clientId, userId: payload.userId })

      return resolve(undefined)
    })
  })

/** The refresh token's claims, or the refusal it earns. */
const verifyRefreshToken = (token: string, clientId: string): InfoJWT => {
  let payload: InfoJWT

  try {
    payload = jwt.verify(token, process.secrets.REFRESH_TOKEN_SECRET) as InfoJWT
  } catch {
    throw invalidGrant('The refresh token is invalid or expired.')
  }

  if (payload?.clientId !== clientId)
    throw invalidGrant('The refresh token was issued for another client.')

  return { clientId: payload.clientId, userId: payload.userId }
}

const exchangeCode = async (
  clientId: string,
  clientSecret: string,
  code: string
): Promise<TokenPair> => {
  if (!code) throw invalidRequest('A `code` is required.')

  const client = await registeredClient(clientId, clientSecret)

  const userInfo = await verifyAuthCode(clientId, code)

  if (
    !userInfo ||
    AuthController.authCodes[userInfo.userId]?.[clientId] !== code
  )
    throw invalidGrant('The authorization code is invalid or already used.')

  AuthController.deleteCode(userInfo.userId, clientId)

  const expirations = expirationsOf(client)
  const live = await livePair(userInfo, expirations)

  // a second exchange for the same caller and client reuses the pair that is still
  // live rather than replacing it: `saveTokensInDB` overwrites, and the token the
  // first tab holds is matched against that single entry - so minting here would
  // sign the first session out, which the API's own exchange avoids for the same
  // reason. A pair whose access token has expired is not reused: `getTokensFromDB`
  // answers only while both are valid, and that caller needs a new one.
  if (live) return live

  return mint(userInfo, expirations)
}

/** The pair already live for this caller and client, if there is one. */
const livePair = async (
  userInfo: InfoJWT,
  expirations: { accessTokenExpiration: number; refreshTokenExpiration: number }
): Promise<TokenPair | undefined> => {
  const stored = await getTokensFromDB(userInfo.userId, userInfo.clientId)

  if (!stored) return undefined

  const claims = jwt.decode(stored.accessToken) as {
    jti?: string
    exp?: number
  } | null

  // `expires_in` states what is LEFT of the reused token, not the client's
  // configured lifetime: the pair answers for the same session, not a new one
  const remaining = claims?.exp
    ? Math.max(claims.exp - Math.floor(Date.now() / 1000), 0)
    : expirations.accessTokenExpiration

  return {
    accessToken: stored.accessToken,
    refreshToken: stored.refreshToken,
    accessTokenExpiration: remaining,
    refreshTokenExpiration: expirations.refreshTokenExpiration,
    jti: claims?.jti ?? ''
  }
}

const rotateRefreshToken = async (
  clientId: string,
  clientSecret: string,
  refreshToken: string
): Promise<TokenPair> => {
  if (!refreshToken) throw invalidRequest('A `refresh_token` is required.')

  const client = await registeredClient(clientId, clientSecret)

  const userInfo = verifyRefreshToken(refreshToken, clientId)

  // the stored REFRESH token alone, not the pair: a pair is only returned while
  // both tokens verify, and a client refreshes precisely because its access token
  // has expired
  const stored = await getStoredRefreshToken(userInfo.userId, clientId)

  // a token that no longer matches what is stored has been rotated or revoked,
  // which is what makes this grant single-use
  if (!stored || stored !== refreshToken)
    throw invalidGrant('The refresh token is invalid, expired or already used.')

  return mint(userInfo, expirationsOf(client))
}

const passwordGrant = async (
  clientId: string,
  clientSecret: string,
  username: string,
  password: string
): Promise<TokenPair> => {
  if (!username || !password)
    throw invalidRequest('`username` and `password` are required.')

  // the public client is the whole credential: it holds no secret, and only it
  // may use this grant - a registered client has a secret to present instead
  if (clientId !== SAS_CLI_CLIENT_ID || clientSecret !== '')
    throw invalidClient(
      `The password grant belongs to the public client \`${SAS_CLI_CLIENT_ID}\`.`
    )

  const user = await userForPasswordGrant(username, password)

  return mint({ clientId, userId: user.uid }, PUBLIC_CLIENT_EXPIRATIONS)
}

/**
 * The pair, in the answer shape the estate's capture records - minus `id_token`.
 *
 * The recorded shape has ten keys and one of them is `id_token`; this server mints
 * none, because an ID token is an assertion about an OpenID Connect identity and
 * this estate answers "who is this" with `GET /identities/users/@currentUser`
 * (see the module doc). Two of the fields that are emitted - `refresh_expires_in`
 * and `jti` - are quoted for the code and password grants as well, though the
 * capture only exercised the refresh grant (`steps: ['auth/token-refresh',
 * 'auth/token-refresh-refused']`): the shape is the estate's, the grants are ours.
 */
export const tokenResponse = (pair: TokenPair) => ({
  access_token: pair.accessToken,
  refresh_token: pair.refreshToken,
  token_type: 'bearer',
  expires_in: pair.accessTokenExpiration,
  refresh_expires_in: pair.refreshTokenExpiration,
  scope: '',
  jti: pair.jti,
  revocable: true,
  refresh_revocable: true
})

/**
 * The endpoint.
 *
 * Unauthenticated on purpose: the credentials in the request are its point, and
 * a caller that already held a token would not need it - which is also why the
 * estate's guard leaves this path open.
 */
export const oauthToken = async (req: Request, res: Response) => {
  let body: Record<string, string>

  try {
    body = await parseTokenBody(req, res)
  } catch (error: any) {
    return res.status(400).json({
      error: 'invalid_request',
      error_description: String(error?.message ?? error)
    })
  }

  const { clientId, clientSecret } = clientCredentialsOf(req, body)

  if (!clientId)
    return res.status(401).json({
      error: 'invalid_client',
      error_description: 'A client id is required.'
    })

  try {
    let pair: TokenPair

    switch (body.grant_type) {
      case 'authorization_code':
        pair = await exchangeCode(clientId, clientSecret, body.code)
        break
      case 'refresh_token':
        pair = await rotateRefreshToken(
          clientId,
          clientSecret,
          body.refresh_token
        )
        break
      case 'password':
        pair = await passwordGrant(
          clientId,
          clientSecret,
          body.username,
          body.password
        )
        break
      default:
        return res.status(400).json({
          error: 'unsupported_grant_type',
          error_description:
            'The estate answers authorization_code, refresh_token and password.'
        })
    }

    // RFC 6749 section 5.1: a token response must not be cached, or a proxy
    // between the client and this server can replay a bearer token
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('Pragma', 'no-cache')

    return res.status(200).json(tokenResponse(pair))
  } catch (error) {
    if (error instanceof OAuthError)
      return res.status(error.status).json({
        error: error.error,
        error_description: error.description
      })

    throw error
  }
}
