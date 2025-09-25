import path from 'path'
import express from 'express'
import { Request, Route, Tags, Post, Body, Get, Example } from 'tsoa'
import { readFile, convertSecondsToHms } from '@sasjs/utils'

import User from '../model/User'
import Client from '../model/Client'
import {
  getWebBuildFolder,
  generateAuthCode,
  RateLimiter,
  AuthProviderType,
  LDAPClient
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
      process.env.AUTH_PROVIDERS === AuthProviderType.LDAP &&
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

  // code to prevent brute force attack

  const rateLimiter = RateLimiter.getInstance()

  if (!validPass) {
    const retrySecs = await rateLimiter.consume(req.ip || 'unknown', user?.username)
    if (retrySecs > 0) throw errors.tooManyRequests(retrySecs)
  }

  if (!user) throw errors.userNotFound
  if (!validPass) throw errors.invalidPassword

  // Reset on successful authorization
  rateLimiter.resetOnSuccess(req.ip || 'unknown', user.username)

  req.session.loggedIn = true
  req.session.user = {
    userId: user.id,
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
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      isAdmin: user.isAdmin,
      needsToUpdatePassword: user.needsToUpdatePassword
    }
  }
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
  tooManyRequests: (seconds: number) => ({
    code: 429,
    message: `Too Many Requests! Retry after ${convertSecondsToHms(seconds)}`
  })
}
