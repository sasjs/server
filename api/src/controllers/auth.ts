import express from 'express'
import {
  Security,
  Route,
  Tags,
  Example,
  Post,
  Patch,
  Request,
  Body,
  Query,
  Hidden
} from 'tsoa'
import jwt from 'jsonwebtoken'
import { InfoJWT } from '../types'
import {
  generateAccessToken,
  generateRefreshToken,
  getTokensFromDB,
  removeTokensInDB,
  saveTokensInDB
} from '../utils'
import Client from '../model/Client'
import User from '../model/User'

@Route('SASjsApi/auth')
@Tags('Auth')
export class AuthController {
  static authCodes: { [key: string]: { [key: string]: string } } = {}
  static saveCode = (userId: string, clientId: string, code: string) => {
    if (AuthController.authCodes[userId])
      return (AuthController.authCodes[userId][clientId] = code)

    AuthController.authCodes[userId] = { [clientId]: code }
    return AuthController.authCodes[userId][clientId]
  }
  static deleteCode = (userId: string, clientId: string) =>
    delete AuthController.authCodes[userId][clientId]

  /**
   * Exchanges an authorization code for a token pair.
   *
   * The code is single-use, short-lived, and is issued by
   * `POST /SASLogon/authorize` to a caller that already holds a session. This
   * endpoint requires no authentication of its own: the code is the credential.
   *
   * @summary Exchange an authorization code for tokens
   */
  @Example<TokenResponse>({
    accessToken: 'someRandomCryptoString',
    refreshToken: 'someRandomCryptoString'
  })
  @Post('/token')
  public async token(@Body() body: TokenPayload): Promise<TokenResponse> {
    return token(body)
  }

  /**
   * Issues a new access and refresh token pair for the caller identified by the
   * bearer token. The previous pair is replaced.
   *
   * @summary Refresh the access and refresh tokens
   */
  @Example<TokenResponse>({
    accessToken: 'someRandomCryptoString',
    refreshToken: 'someRandomCryptoString'
  })
  @Security('bearerAuth')
  @Post('/refresh')
  public async refresh(
    @Query() @Hidden() data?: InfoJWT
  ): Promise<TokenResponse> {
    return refresh(data!)
  }

  /**
   * Revokes the access and refresh tokens of the caller and returns no content.
   *
   * @summary Revoke the current tokens
   */
  @Security('bearerAuth')
  @Post('/logout')
  public async logout(@Query() @Hidden() data?: InfoJWT) {
    return logout(data!)
  }

  /**
   * Changes the password of the authenticated user.
   *
   * The current password must be supplied and must match. The request is refused
   * with `405` for an account that authenticates through an external provider
   * (LDAP or OpenID Connect), whose password is not held here.
   *
   * @summary Change the current user's password
   */
  @Security('bearerAuth')
  @Patch('updatePassword')
  public async updatePassword(
    @Request() req: express.Request,
    @Body() body: UpdatePasswordPayload
  ) {
    return updatePassword(req, body)
  }
}

const token = async (data: any): Promise<TokenResponse> => {
  const { clientId, code } = data

  const userInfo = await verifyAuthCode(clientId, code)
  if (!userInfo) throw new Error('Invalid Auth Code')

  if (AuthController.authCodes[userInfo.userId][clientId] !== code)
    throw new Error('Invalid Auth Code')

  AuthController.deleteCode(userInfo.userId, clientId)

  // Re-exchanging a code for the same user/client while a still-valid token
  // pair already exists returns that pair instead of minting a new one -
  // keeps other tabs/sessions using the old tokens alive instead of
  // silently invalidating them (saveTokensInDB below overwrites, it doesn't
  // append).
  const existingTokens = await getTokensFromDB(userInfo.userId, clientId)

  if (existingTokens) {
    return {
      accessToken: existingTokens.accessToken,
      refreshToken: existingTokens.refreshToken
    }
  }

  // Only used to look up token expirations - clientSecret is intentionally
  // not checked here. The credential for this exchange is the auth code
  // itself (single-use, 30s-lived, only obtainable by a caller that already
  // held a valid session - see verifyAuthCode below and web.ts's authorize()).
  const client = await Client.findOne({ clientId })

  if (!client) throw new Error('Invalid clientId.')

  const accessToken = generateAccessToken(
    userInfo,
    client.accessTokenExpiration
  )
  const refreshToken = generateRefreshToken(
    userInfo,
    client.refreshTokenExpiration
  )

  await saveTokensInDB(userInfo.userId, clientId, accessToken, refreshToken)

  return { accessToken, refreshToken }
}

const refresh = async (userInfo: InfoJWT): Promise<TokenResponse> => {
  const client = await Client.findOne({ clientId: userInfo.clientId })
  if (!client) throw new Error('Invalid clientId.')

  const accessToken = generateAccessToken(
    userInfo,
    client.accessTokenExpiration
  )
  const refreshToken = generateRefreshToken(
    userInfo,
    client.refreshTokenExpiration
  )

  await saveTokensInDB(
    userInfo.userId,
    userInfo.clientId,
    accessToken,
    refreshToken
  )

  return { accessToken, refreshToken }
}

const logout = async (userInfo: InfoJWT) => {
  await removeTokensInDB(userInfo.userId, userInfo.clientId)
}

const updatePassword = async (
  req: express.Request,
  data: UpdatePasswordPayload
) => {
  const { currentPassword, newPassword } = data
  const userId = req.user?.userId
  const dbUser = await User.findOne({ _id: userId })

  if (!dbUser)
    throw {
      code: 404,
      message: `User not found!`
    }

  if (dbUser?.authProvider) {
    throw {
      code: 405,
      message:
        'Can not update password of user that is created by an external auth provider.'
    }
  }

  const validPass = dbUser.comparePassword(currentPassword)
  if (!validPass)
    throw {
      code: 403,
      message: `Invalid current password!`
    }

  dbUser.password = User.hashPassword(newPassword)
  dbUser.needsToUpdatePassword = false
  await dbUser.save()
}

interface TokenPayload {
  /**
   * Client ID
   * @example "clientID1"
   */
  clientId: string
  /**
   * Authorization code
   * @example "someRandomCryptoString"
   */
  code: string
}

interface TokenResponse {
  /**
   * Access Token
   * @example "someRandomCryptoString"
   */
  accessToken: string
  /**
   * Refresh Token
   * @example "someRandomCryptoString"
   */
  refreshToken: string
}

interface UpdatePasswordPayload {
  /**
   * Current Password
   * @example "currentPasswordString"
   */
  currentPassword: string
  /**
   * New Password
   * @example "newPassword"
   */
  newPassword: string
}

const verifyAuthCode = async (
  clientId: string,
  code: string
): Promise<InfoJWT | undefined> => {
  return new Promise((resolve) => {
    jwt.verify(code, process.secrets.AUTH_CODE_SECRET, (err, data) => {
      if (err) return resolve(undefined)

      const payload = data as InfoJWT
      const clientInfo: InfoJWT = {
        clientId: payload?.clientId,
        userId: payload?.userId
      }
      if (clientInfo.clientId === clientId) {
        return resolve(clientInfo)
      }
      return resolve(undefined)
    })
  })
}
