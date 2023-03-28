import path from 'path'
import express from 'express'
import { Request, Route, Tags, Post, Body, Get, Example } from 'tsoa'
import { readFile } from '@sasjs/utils'

import User from '../model/User'
import Client from '../model/Client'
import {
  getWebBuildFolder,
  generateAuthCode,
  getRateLimiters,
  AuthProviderType,
  LDAPClient,
  secondsToHms
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
  // code for preventing brute force attack

  const {
    MAX_WRONG_ATTEMPTS_BY_IP_PER_DAY,
    MAX_CONSECUTIVE_FAILS_BY_USERNAME_AND_IP
  } = process.env

  const { limiterSlowBruteByIP, limiterConsecutiveFailsByUsernameAndIP } =
    getRateLimiters()

  const ipAddr = req.ip
  const usernameIPkey = getUsernameIPkey(username, ipAddr)

  const [resSlowByIP, resUsernameAndIP] = await Promise.all([
    limiterSlowBruteByIP.get(ipAddr),
    limiterConsecutiveFailsByUsernameAndIP.get(usernameIPkey)
  ])

  let retrySecs = 0

  // Check if IP or Username + IP is already blocked
  if (
    resSlowByIP !== null &&
    resSlowByIP.consumedPoints >= Number(MAX_WRONG_ATTEMPTS_BY_IP_PER_DAY)
  ) {
    retrySecs = Math.round(resSlowByIP.msBeforeNext / 1000) || 1
  } else if (
    resUsernameAndIP !== null &&
    resUsernameAndIP.consumedPoints >=
      Number(MAX_CONSECUTIVE_FAILS_BY_USERNAME_AND_IP)
  ) {
    retrySecs = Math.round(resUsernameAndIP.msBeforeNext / 1000) || 1
  }

  if (retrySecs > 0) {
    throw {
      code: 429,
      message: `Too Many Requests! Retry after ${secondsToHms(retrySecs)}`
    }
  }

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

  // Consume 1 point from limiters on wrong attempt and block if limits reached
  if (!validPass) {
    try {
      const promises = [limiterSlowBruteByIP.consume(ipAddr)]
      if (user) {
        // Count failed attempts by Username + IP only for registered users
        promises.push(
          limiterConsecutiveFailsByUsernameAndIP.consume(usernameIPkey)
        )
      }

      await Promise.all(promises)
    } catch (rlRejected: any) {
      if (rlRejected instanceof Error) {
        throw rlRejected
      } else {
        retrySecs = Math.round(rlRejected.msBeforeNext / 1000) || 1

        throw {
          code: 429,
          message: `Too Many Requests! Retry after ${secondsToHms(retrySecs)}`
        }
      }
    }
  }

  if (!user) throw { code: 401, message: 'Username is not found.' }
  if (!validPass) throw { code: 401, message: 'Invalid Password.' }

  if (resUsernameAndIP !== null && resUsernameAndIP.consumedPoints > 0) {
    // Reset on successful authorization
    await limiterConsecutiveFailsByUsernameAndIP.delete(usernameIPkey)
  }

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

const getUsernameIPkey = (username: string, ip: string) => `${username}_${ip}`

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
