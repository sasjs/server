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
  static saveCode = (userId: number, clientId: string, code: string) => {
    if (AuthController.authCodes[userId])
      return (AuthController.authCodes[userId][clientId] = code)

    AuthController.authCodes[userId] = { [clientId]: code }
    return AuthController.authCodes[userId][clientId]
  }
  static deleteCode = (userId: number, clientId: string) =>
    delete AuthController.authCodes[userId][clientId]

  /**
   * @summary Accepts client/auth code and returns access/refresh tokens
   *
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
   * @summary Returns new access/refresh tokens
   *
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
   * @summary Logout terminate access/refresh tokens and returns nothing
   *
   */
  @Security('bearerAuth')
  @Post('/logout')
  public async logout(@Query() @Hidden() data?: InfoJWT) {
    return logout(data!)
  }

  /**
   * @summary Update user's password.
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

  // get tokens from DB
  const existingTokens = await getTokensFromDB(userInfo.userId, clientId)
  if (existingTokens) {
    return {
      accessToken: existingTokens.accessToken,
      refreshToken: existingTokens.refreshToken
    }
  }

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
  const dbUser = await User.findOne({ userId })

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

      const clientInfo: InfoJWT = {
        clientId: data?.clientId,
        userId: data?.userId
      }
      if (clientInfo.clientId === clientId) {
        return resolve(clientInfo)
      }
      return resolve(undefined)
    })
  })
}
