import path from 'path'
import express from 'express'
import { Request, Route, Tags, Post, Body, Get, Example } from 'tsoa'
import { readFile } from '@sasjs/utils'

import User from '../model/User'
import Client from '../model/Client'
import {
  getWebBuildFolder,
  generateAuthCode,
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
  if (!user) throw new Error('Username is not found.')

  if (
    process.env.AUTH_PROVIDERS === AuthProviderType.LDAP &&
    user.authProvider === AuthProviderType.LDAP
  ) {
    const ldapClient = await LDAPClient.init()
    await ldapClient.verifyUser(username, password)
  } else {
    const validPass = user.comparePassword(password)
    if (!validPass) throw new Error('Invalid password.')
  }

  req.session.loggedIn = true
  req.session.user = {
    userId: user.id,
    clientId: 'web_app',
    username: user.username,
    displayName: user.displayName,
    isAdmin: user.isAdmin,
    isActive: user.isActive,
    autoExec: user.autoExec
  }

  return {
    loggedIn: true,
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      isAdmin: user.isAdmin
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
