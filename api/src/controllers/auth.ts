import { Security, Route, Tags, Example, Post, Body, Query, Hidden } from 'tsoa'
import jwt from 'jsonwebtoken'
import User from '../model/User'
import Client from '../model/Client'
import { InfoJWT } from '../types'
import {
  generateAccessToken,
  generateAuthCode,
  generateRefreshToken,
  removeTokensInDB,
  saveTokensInDB
} from '../utils'

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
   * @summary Accept a valid username/password, plus a CLIENT_ID, and return an AUTH_CODE
   *
   */
  @Example<AuthorizeResponse>({
    code: 'someRandomCryptoString'
  })
  @Post('/authorize')
  public async authorize(
    @Body() body: AuthorizePayload
  ): Promise<AuthorizeResponse> {
    return authorize(body)
  }

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
}

const authorize = async (data: any): Promise<AuthorizeResponse> => {
  const { username, password, clientId } = data

  const client = await Client.findOne({ clientId })
  if (!client) throw new Error('Invalid clientId.')

  // Authenticate User
  const user = await User.findOne({ username })
  if (!user) throw new Error('Username is not found.')

  const validPass = user.comparePassword(password)
  if (!validPass) throw new Error('Invalid password.')

  // generate authorization code against clientId
  const userInfo: InfoJWT = {
    clientId,
    userId: user.id
  }
  const code = AuthController.saveCode(
    user.id,
    clientId,
    generateAuthCode(userInfo)
  )

  return { code }
}

const token = async (data: any): Promise<TokenResponse> => {
  const { clientId, code } = data

  const userInfo = await verifyAuthCode(clientId, code)
  if (!userInfo) throw new Error('Invalid Auth Code')

  if (AuthController.authCodes[userInfo.userId][clientId] !== code)
    throw new Error('Invalid Auth Code')

  AuthController.deleteCode(userInfo.userId, clientId)

  const accessToken = generateAccessToken(userInfo)
  const refreshToken = generateRefreshToken(userInfo)

  await saveTokensInDB(userInfo.userId, clientId, accessToken, refreshToken)

  return { accessToken, refreshToken }
}

const refresh = async (userInfo: InfoJWT): Promise<TokenResponse> => {
  const accessToken = generateAccessToken(userInfo)
  const refreshToken = generateRefreshToken(userInfo)

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

interface AuthorizePayload {
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

const verifyAuthCode = async (
  clientId: string,
  code: string
): Promise<InfoJWT | undefined> => {
  return new Promise((resolve, reject) => {
    jwt.verify(code, process.env.AUTH_CODE_SECRET as string, (err, data) => {
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
