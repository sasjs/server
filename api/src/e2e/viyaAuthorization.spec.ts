import { Express } from 'express'
import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { Browser, chromium } from 'playwright'
import { requireWebBuild } from './fixture'
import { UserController } from '../controllers/user'
import Client from '../model/Client'
import User from '../model/User'
import { OIDCClient } from '../utils'
import {
  startStubIdP,
  STUB_CLIENT_ID,
  STUB_CLIENT_SECRET
} from '../utils/specs/stubIdP'

const clientId = 'browser-flow-client'
const clientSecret = 'browser-flow-secret'

describe('Viya authorization in a fresh browser', () => {
  let mongo: MongoMemoryServer
  let con: Mongoose
  let server: ReturnType<Express['listen']>
  let browser: Browser

  beforeAll(async () => {
    requireWebBuild()
    process.env.EMULATE_VIYA = 'true'
    mongo = await MongoMemoryServer.create()
    process.env.DB_CONNECT = mongo.getUri()
    const app = (await import('../app')).default
    con = await mongoose.connect(mongo.getUri())
    await new UserController().createUser({
      displayName: 'Browser User',
      username: 'browseruser',
      password: 'browser-password',
      isAdmin: false,
      isActive: true
    })
    await User.updateOne(
      { username: 'browseruser' },
      { needsToUpdatePassword: false }
    )
    await Client.create({ clientId, clientSecret })
    server = (await app).listen(0, '127.0.0.1')
    browser = await chromium.launch({
      executablePath: process.env.CHROMIUM_PATH
    })
  })

  afterAll(async () => {
    await browser?.close()
    await new Promise<void>((resolve) => server?.close(() => resolve()))
    await con?.connection.dropDatabase()
    await con?.connection.close()
    await mongo?.stop()
  })

  it('returns through OIDC to the authorization code screen', async () => {
    const base = `http://127.0.0.1:${(server.address() as any).port}`
    const idp = await startStubIdP()
    const savedEnv = { ...process.env }
    process.env.AUTH_PROVIDERS = 'oidc'
    process.env.OIDC_ISSUER_URL = idp.issuer
    process.env.OIDC_CLIENT_ID = STUB_CLIENT_ID
    process.env.OIDC_CLIENT_SECRET = STUB_CLIENT_SECRET
    process.env.OIDC_REDIRECT_URI = `${base}/SASLogon/openid/callback`
    process.env.OIDC_PROVIDER_NAME = 'Test Identity'
    process.env.OIDC_JIT_PROVISION = 'true'
    OIDCClient.reset()
    const context = await browser.newContext()
    try {
      const page = await context.newPage()
      idp.enableBrowserAuthorization()
      await page.goto(
        `${base}/SASLogon/oauth/authorize?client_id=${clientId}&response_type=code`
      )
      const issued = page.waitForResponse(
        (r) =>
          r.url().endsWith('/SASLogon/authorize') &&
          r.request().method() === 'POST'
      )
      await page
        .getByRole('button', { name: 'Sign in with Test Identity' })
        .click()
      const auth = await issued
      expect(auth.status()).toBe(200)
      const { code } = await auth.json()
      await page.getByText(code, { exact: true }).waitFor()
      expect(new URL(page.url()).pathname).toBe('/logon')
      const exchanged = await fetch(`${base}/SASLogon/oauth/token`, {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
        },
        body: new URLSearchParams({ grant_type: 'authorization_code', code })
      })
      expect(exchanged.status).toBe(200)
    } finally {
      await context.close()
      await idp.close()
      process.env = savedEnv
      OIDCClient.reset()
    }
  })

  it('uses the installed Viya adapter before and after browser sign-in', async () => {
    const base = `http://127.0.0.1:${(server.address() as any).port}`
    const context = await browser.newContext({ bypassCSP: true })
    try {
      const page = await context.newPage()
      await page.goto(`${base}/logon?client_id=${clientId}&response_type=code`)
      await page.addScriptTag({
        path: require.resolve('@sasjs/adapter/dist/sasjs-adapter.js')
      })
      const makeCode = () =>
        page.evaluate((id) => {
          const SASjs = (window as any).SASjs.default
          const adapter = new SASjs({ serverType: 'SASVIYA' })
          return adapter.getAuthCode(id)
        }, clientId)

      // An XHR cannot interact with the login page or supply credentials.
      expect(await makeCode()).toBeNull()
      await page.locator('#username').fill('browseruser')
      await page.locator('#password').fill('browser-password')
      const issued = page.waitForResponse(
        (r) =>
          r.url().endsWith('/SASLogon/authorize') &&
          r.request().method() === 'POST'
      )
      await page.locator('form button[type="submit"]').click()
      expect((await issued).status()).toBe(200)
      const code = await makeCode()
      expect(typeof code).toBe('string')
      expect(code).toBeTruthy()
      const exchanged = await fetch(`${base}/SASLogon/oauth/token`, {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
        },
        body: new URLSearchParams({ grant_type: 'authorization_code', code })
      })
      expect(exchanged.status).toBe(200)
    } finally {
      await context.close()
    }
  })

  it('signs in on the actual UI, displays a code and exchanges it for a usable token', async () => {
    const base = `http://127.0.0.1:${(server.address() as any).port}`
    const context = await browser.newContext()
    try {
      const page = await context.newPage()
      const response = await page.goto(
        `${base}/SASLogon/oauth/authorize?client_id=${clientId}&response_type=code`
      )
      expect(response?.status()).toBe(200)
      expect(new URL(page.url()).pathname).toBe('/logon')
      await page.locator('#username').fill('browseruser')
      await page.locator('#password').fill('browser-password')
      const issued = page.waitForResponse(
        (r) =>
          r.url().endsWith('/SASLogon/authorize') &&
          r.request().method() === 'POST'
      )
      await page.locator('form button[type="submit"]').click()
      const auth = await issued
      expect(auth.status()).toBe(200)
      const { code } = await auth.json()
      expect(typeof code).toBe('string')
      await page.getByText(code, { exact: true }).waitFor()
      const tokenResponse = await fetch(`${base}/SASLogon/oauth/token`, {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
        },
        body: new URLSearchParams({ grant_type: 'authorization_code', code })
      })
      expect(tokenResponse.status).toBe(200)
      const tokens = (await tokenResponse.json()) as {
        access_token: string
        refresh_token: string
      }
      expect(typeof tokens.refresh_token).toBe('string')
      const identity = await fetch(`${base}/identities/users/@currentUser`, {
        headers: { authorization: `Bearer ${tokens.access_token}` }
      })
      expect(identity.status).toBe(200)
    } finally {
      await context.close()
    }
  })
})
