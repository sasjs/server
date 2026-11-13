/**
 * `POST /SASLogon/oauth/token` - the grants a Viya client actually speaks.
 *
 * The shapes here are the clients', not this server's: `@sasjs/adapter` posts
 * the code exchange as form encoding with Basic auth and the refresh grant as
 * multipart, and the CLI posts the password grant as form encoding against the
 * secret-less `sas.cli` client. A case that posts JSON with camelCase fields
 * would pass against an endpoint neither client can reach.
 */
import express, { Express } from 'express'
import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'
import jwt from 'jsonwebtoken'

import Client from '../../../model/Client'
import User from '../../../model/User'
import { AuthController } from '../../../controllers/auth'
import { UserController } from '../../../controllers/'
import {
  generateAccessToken,
  generateAuthCode,
  SECRETS,
  resetLoginFailures
} from '../../../utils'
import type { Services } from '@sasjs/api'
import { createViyaRouter } from '../index'

const CLIENT_ID = 'viyaClient'
const CLIENT_SECRET = 'viyaClientSecret'
const CLIENT_EXPIRY = 900

const services = (): Services => ({
  drive: undefined as never,
  identity: undefined as never,
  viya: {
    serverUrl: 'http://localhost:5000',
    execute: async () => ({ webout: '[]', log: '' })
  }
})

const basic = (clientId: string, secret: string) =>
  'Basic ' + Buffer.from(`${clientId}:${secret}`).toString('base64')

describe('the estate token port', () => {
  let app: Express
  let con: Mongoose
  let mongoServer: MongoMemoryServer
  const userController = new UserController()

  const account = {
    displayName: 'Token User',
    username: 'tokenuser',
    password: 'userPassword',
    isAdmin: false,
    isActive: true
  }

  beforeAll(async () => {
    process.secrets = SECRETS

    mongoServer = await MongoMemoryServer.create()
    con = await mongoose.connect(mongoServer.getUri())

    await userController.createUser(account)

    await Client.create({
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      accessTokenExpiration: CLIENT_EXPIRY,
      refreshTokenExpiration: CLIENT_EXPIRY * 4
    })

    const server = express()
    server.use(express.json())
    server.use('/', createViyaRouter(services))

    app = server
  })

  afterAll(async () => {
    await con.connection.dropDatabase()
    await con.connection.close()
    await mongoServer.stop()
  })

  beforeEach(() => resetLoginFailures(account.username))

  const passwordGrant = () =>
    request(app)
      .post('/SASLogon/oauth/token')
      .set('Authorization', basic('sas.cli', ''))
      .type('form')
      .send({
        grant_type: 'password',
        username: account.username,
        password: account.password
      })

  it('answers the CLI password grant with a token pair', async () => {
    const answer = await passwordGrant()

    expect(answer.status).toBe(200)

    // the keys the clients read, in the estate's snake_case
    expect(typeof answer.body.access_token).toBe('string')
    expect(typeof answer.body.refresh_token).toBe('string')
    expect(answer.body.token_type).toBe('bearer')
    expect(typeof answer.body.expires_in).toBe('number')
    expect(typeof answer.body.jti).toBe('string')

    // and the access token is one THIS server issued for that account: a client
    // presents it on /compute, where the guard verifies it with the same secret
    const claims = jwt.verify(
      answer.body.access_token,
      process.secrets.ACCESS_TOKEN_SECRET
    ) as { clientId: string; userId: string }

    expect(claims.clientId).toBe('sas.cli')
    expect(claims.userId).toBeTruthy()
  })

  it('refuses a wrong password without saying which half was wrong', async () => {
    const answer = await request(app)
      .post('/SASLogon/oauth/token')
      .set('Authorization', basic('sas.cli', ''))
      .type('form')
      .send({
        grant_type: 'password',
        username: account.username,
        password: 'wrong'
      })

    expect(answer.status).toBe(401)
    expect(answer.body.error).toBe('invalid_grant')
  })

  it('keeps the password grant to the public client', async () => {
    // a registered client has a secret to present, and takes the code exchange
    const answer = await request(app)
      .post('/SASLogon/oauth/token')
      .set('Authorization', basic(CLIENT_ID, CLIENT_SECRET))
      .type('form')
      .send({
        grant_type: 'password',
        username: account.username,
        password: account.password
      })

    expect(answer.status).toBe(401)
    expect(answer.body.error).toBe('invalid_client')
  })

  const codeGrant = async () => {
    const user = await userController.getUserByUsername(
      { user: { isAdmin: false } } as any,
      account.username
    )

    const code = AuthController.saveCode(
      user.uid,
      CLIENT_ID,
      generateAuthCode({ clientId: CLIENT_ID, userId: user.uid })
    )

    return request(app)
      .post('/SASLogon/oauth/token')
      .set('Authorization', basic(CLIENT_ID, CLIENT_SECRET))
      .type('form')
      .send({ grant_type: 'authorization_code', code })
  }

  it('exchanges an authorization code for a pair', async () => {
    const answer = await codeGrant()

    expect(answer.status).toBe(200)
    expect(typeof answer.body.access_token).toBe('string')
    expect(typeof answer.body.refresh_token).toBe('string')
    // the expirations are the registration's, not the public client's defaults
    expect(answer.body.expires_in).toBe(CLIENT_EXPIRY)
    expect(answer.body.refresh_expires_in).toBe(CLIENT_EXPIRY * 4)
  })

  it('refuses a code it has already exchanged', async () => {
    const user = await userController.getUserByUsername(
      { user: { isAdmin: false } } as any,
      account.username
    )
    const code = AuthController.saveCode(
      user.uid,
      CLIENT_ID,
      generateAuthCode({ clientId: CLIENT_ID, userId: user.uid })
    )

    const exchange = () =>
      request(app)
        .post('/SASLogon/oauth/token')
        .set('Authorization', basic(CLIENT_ID, CLIENT_SECRET))
        .type('form')
        .send({ grant_type: 'authorization_code', code })

    expect((await exchange()).status).toBe(200)

    const replay = await exchange()

    expect(replay.status).toBe(401)
    expect(replay.body.error).toBe('invalid_grant')
  })

  it('refuses a code presented with the wrong client secret', async () => {
    const user = await userController.getUserByUsername(
      { user: { isAdmin: false } } as any,
      account.username
    )
    const code = AuthController.saveCode(
      user.uid,
      CLIENT_ID,
      generateAuthCode({ clientId: CLIENT_ID, userId: user.uid })
    )

    const answer = await request(app)
      .post('/SASLogon/oauth/token')
      .set('Authorization', basic(CLIENT_ID, 'not-the-secret'))
      .type('form')
      .send({ grant_type: 'authorization_code', code })

    expect(answer.status).toBe(401)
    expect(answer.body.error).toBe('invalid_client')
    // one description for both halves: naming the half would say whether the id
    // is registered, which the password grant already withholds
    expect(answer.body.error_description).toBe('Invalid client id or secret.')
  })

  it('reuses the live pair on a second exchange, so the first tab stays signed in', async () => {
    const first = await codeGrant()
    const second = await codeGrant()

    // `saveTokensInDB` overwrites the single entry per caller and client, so
    // minting here would sign the first tab out on every estate path
    expect(second.status).toBe(200)
    expect(second.body.access_token).toBe(first.body.access_token)
    expect(second.body.refresh_token).toBe(first.body.refresh_token)

    // what is left of the reused token, not a fresh lifetime
    expect(second.body.expires_in).toBeLessThanOrEqual(CLIENT_EXPIRY)
  })

  it('rotates the pair, and refuses the refresh token it replaced', async () => {
    const granted = await codeGrant()
    const first = granted.body.refresh_token as string

    // the adapter posts this grant as multipart, so the case does too
    const rotated = await request(app)
      .post('/SASLogon/oauth/token')
      .set('Authorization', basic(CLIENT_ID, CLIENT_SECRET))
      .field('grant_type', 'refresh_token')
      .field('refresh_token', first)

    expect(rotated.status).toBe(200)
    expect(rotated.body.refresh_token).not.toEqual(first)

    const replay = await request(app)
      .post('/SASLogon/oauth/token')
      .set('Authorization', basic(CLIENT_ID, CLIENT_SECRET))
      .field('grant_type', 'refresh_token')
      .field('refresh_token', first)

    expect(replay.status).toBe(401)
    expect(replay.body.error).toBe('invalid_grant')

    // and the token it was given in exchange works
    const next = await request(app)
      .post('/SASLogon/oauth/token')
      .set('Authorization', basic(CLIENT_ID, CLIENT_SECRET))
      .field('grant_type', 'refresh_token')
      .field('refresh_token', rotated.body.refresh_token)

    expect(next.status).toBe(200)
  })

  it('refreshes a pair whose access token has expired', async () => {
    // what a client holds when it needs to refresh: a refresh token and an access
    // token that is already dead. A stored-pair lookup that validates BOTH would
    // answer nothing here and refuse the one request this grant exists for
    const granted = await codeGrant()
    const refreshToken = granted.body.refresh_token as string

    const user = await User.findOne({ username: account.username })
    const stored: any = user!.tokens.find(
      (tokenObj: any) => tokenObj.clientId === CLIENT_ID
    )
    stored.accessToken = generateAccessToken(
      { clientId: CLIENT_ID, userId: user!.uid },
      -60
    )
    await user!.save()

    const rotated = await request(app)
      .post('/SASLogon/oauth/token')
      .set('Authorization', basic(CLIENT_ID, CLIENT_SECRET))
      .field('grant_type', 'refresh_token')
      .field('refresh_token', refreshToken)

    expect(rotated.status).toBe(200)
    expect(typeof rotated.body.access_token).toBe('string')
  })

  it('does not count a sign-in that could not be attempted', async () => {
    // six attempts is past the five-failure lockout: with local sign-in switched
    // off the credential is never compared, so nothing here is a failed sign-in
    // and the answer stays explanatory rather than becoming a 429
    process.env.LOCAL_LOGIN_ENABLED = 'false'

    try {
      for (let attempt = 0; attempt < 6; attempt++) {
        const answer = await request(app)
          .post('/SASLogon/oauth/token')
          .set('Authorization', basic('sas.cli', ''))
          .type('form')
          .send({
            grant_type: 'password',
            username: account.username,
            password: account.password
          })

        expect(answer.status).toBe(401)
        expect(answer.body.error_description).toMatch(/disabled/)
      }
    } finally {
      delete process.env.LOCAL_LOGIN_ENABLED
    }
  })

  it('tells a proxy not to cache the pair', async () => {
    const answer = await passwordGrant()

    // RFC 6749 section 5.1, and the reason it is a rule: a cached token response
    // is a bearer token a proxy can replay
    expect(answer.headers['cache-control']).toBe('no-store')
    expect(answer.headers['pragma']).toBe('no-cache')
  })

  it('refuses a grant no client sends', async () => {
    const answer = await request(app)
      .post('/SASLogon/oauth/token')
      .set('Authorization', basic(CLIENT_ID, CLIENT_SECRET))
      .type('form')
      .send({ grant_type: 'client_credentials' })

    expect(answer.status).toBe(400)
    expect(answer.body.error).toBe('unsupported_grant_type')
  })
})
