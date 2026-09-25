import { Express } from 'express'
import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'
import appPromise from '../../../app'
import User from '../../../model/User'
import { OIDCClient } from '../../../utils'
import {
  startStubIdP,
  StubIdP,
  STUB_CLIENT_ID,
  STUB_CLIENT_SECRET,
  STUB_REDIRECT_URI
} from '../../../utils/specs/stubIdP'

const managedEnvVars = [
  'AUTH_PROVIDERS',
  'MODE',
  'OIDC_ISSUER_URL',
  'OIDC_DISCOVERY_URL',
  'OIDC_CLIENT_ID',
  'OIDC_CLIENT_SECRET',
  'OIDC_REDIRECT_URI',
  'OIDC_SIGNING_ALG',
  'OIDC_SCOPE',
  'OIDC_PROVIDER_NAME',
  'OIDC_USERNAME_CLAIM',
  'OIDC_JIT_PROVISION',
  'OIDC_POST_LOGOUT_REDIRECT_URI'
]

describe('OIDC web routes', () => {
  let app: Express
  let con: Mongoose
  let mongoServer: MongoMemoryServer
  let idp: StubIdP
  let originalEnv: { [key: string]: string | undefined }

  beforeAll(async () => {
    app = await appPromise
    originalEnv = { ...process.env }
    ;(process as any).logger = { info: () => {}, error: () => {} }

    mongoServer = await MongoMemoryServer.create({
      instance: { storageEngine: 'wiredTiger' }
    })
    con = await mongoose.connect(mongoServer.getUri())
  })

  afterAll(async () => {
    await con.connection.dropDatabase()
    await con.connection.close()
    await mongoServer.stop()
  })

  beforeEach(async () => {
    idp = await startStubIdP()

    process.env.AUTH_PROVIDERS = 'oidc'
    process.env.MODE = 'server'
    process.env.OIDC_ISSUER_URL = idp.issuer
    process.env.OIDC_CLIENT_ID = STUB_CLIENT_ID
    process.env.OIDC_CLIENT_SECRET = STUB_CLIENT_SECRET
    process.env.OIDC_REDIRECT_URI = STUB_REDIRECT_URI
    process.env.OIDC_PROVIDER_NAME = 'Example Identity'
    process.env.OIDC_JIT_PROVISION = 'true'
    delete process.env.OIDC_USERNAME_CLAIM
    delete process.env.OIDC_POST_LOGOUT_REDIRECT_URI
    delete process.env.OIDC_DISCOVERY_URL

    OIDCClient.reset()
  })

  afterEach(async () => {
    OIDCClient.reset()
    await idp.close()
    await User.deleteMany({})

    managedEnvVars.forEach((key) => {
      if (originalEnv[key] === undefined) delete process.env[key]
      else process.env[key] = originalEnv[key]
    })
  })

  /**
   * Drives the first half of the flow the way a browser would: hit the start
   * route, then read the state and nonce out of the redirect the provider
   * would have received.
   */
  const beginFlow = async (agent: ReturnType<typeof request.agent>) => {
    const res = await agent.get('/SASLogon/openid').expect(302)

    const url = new URL(res.headers.location)

    return {
      location: url,
      state: url.searchParams.get('state') as string,
      nonce: url.searchParams.get('nonce') as string
    }
  }

  describe('when the provider is not configured', () => {
    it('should 404 on the start route', async () => {
      process.env.AUTH_PROVIDERS = 'ldap'

      await request(app).get('/SASLogon/openid').expect(404)
    })

    it('should 404 on the callback', async () => {
      process.env.AUTH_PROVIDERS = 'ldap'

      await request(app).get('/SASLogon/openid/callback?code=x').expect(404)
    })
  })

  describe('GET /SASLogon/openid', () => {
    it('should redirect to the provider with every required parameter', async () => {
      const { location } = await beginFlow(request.agent(app))

      expect(`${location.origin}${location.pathname}`).toEqual(
        `${idp.issuer}/auth`
      )
      expect(location.searchParams.get('client_id')).toEqual(STUB_CLIENT_ID)
      expect(location.searchParams.get('redirect_uri')).toEqual(
        STUB_REDIRECT_URI
      )
      expect(location.searchParams.get('response_type')).toEqual('code')
      expect(location.searchParams.get('scope')).toEqual('openid profile email')
      expect(location.searchParams.get('state')).toBeTruthy()
      expect(location.searchParams.get('nonce')).toBeTruthy()
    })

    it('should use a fresh state and nonce per attempt', async () => {
      const first = await beginFlow(request.agent(app))
      const second = await beginFlow(request.agent(app))

      expect(first.state).not.toEqual(second.state)
      expect(first.nonce).not.toEqual(second.nonce)
    })
  })

  describe('GET /SASLogon/openid/callback', () => {
    it('should sign the user in and establish a session', async () => {
      const agent = request.agent(app)
      const { state, nonce } = await beginFlow(agent)

      idp.setIdTokenClaims({
        sub: 'alice',
        preferred_username: 'alice',
        name: 'Alice Example',
        nonce
      })

      await agent
        .get(`/SASLogon/openid/callback?code=code-1&state=${state}`)
        .expect(302)
        .expect('location', '/')

      // The session cookie alone must now authenticate API calls.
      const session = await agent.get('/SASjsApi/session').expect(200)

      expect(session.body.username).toEqual('alice')
      expect(session.body.isAdmin).toEqual(true)
    })

    it('should make the first provisioned user an administrator', async () => {
      const agent = request.agent(app)
      const { state, nonce } = await beginFlow(agent)

      idp.setIdTokenClaims({ sub: 'first', preferred_username: 'first', nonce })

      await agent
        .get(`/SASLogon/openid/callback?code=c&state=${state}`)
        .expect(302)

      const user = await User.findOne({ username: 'first' })

      expect(user).toBeTruthy()
      expect(user!.isAdmin).toEqual(true)
      expect(user!.authProvider).toEqual('oidc')
      expect(user!.authProviderId).toEqual('first')
      expect(user!.needsToUpdatePassword).toEqual(false)
    })

    it('should NOT make later users administrators', async () => {
      await User.create({
        displayName: 'Existing Admin',
        username: 'theadmin',
        password: 'x',
        isAdmin: true
      })

      const agent = request.agent(app)
      const { state, nonce } = await beginFlow(agent)

      idp.setIdTokenClaims({
        sub: 'second',
        preferred_username: 'second',
        nonce
      })

      await agent
        .get(`/SASLogon/openid/callback?code=c&state=${state}`)
        .expect(302)

      const user = await User.findOne({ username: 'second' })

      expect(user!.isAdmin).toEqual(false)
    })

    it('should sign an existing user back in without duplicating them', async () => {
      const first = request.agent(app)
      const flow1 = await beginFlow(first)
      idp.setIdTokenClaims({
        sub: 'alice',
        preferred_username: 'alice',
        nonce: flow1.nonce
      })
      await first
        .get(`/SASLogon/openid/callback?code=c&state=${flow1.state}`)
        .expect(302)

      const second = request.agent(app)
      const flow2 = await beginFlow(second)
      idp.setIdTokenClaims({
        sub: 'alice',
        preferred_username: 'alice',
        nonce: flow2.nonce
      })
      await second
        .get(`/SASLogon/openid/callback?code=c&state=${flow2.state}`)
        .expect(302)

      expect(await User.countDocuments({ username: 'alice' })).toEqual(1)
    })

    it('should match an existing user by subject even if the username claim changes', async () => {
      const first = request.agent(app)
      const flow1 = await beginFlow(first)
      idp.setIdTokenClaims({
        sub: 'stable-subject',
        preferred_username: 'originalname',
        nonce: flow1.nonce
      })
      await first
        .get(`/SASLogon/openid/callback?code=c&state=${flow1.state}`)
        .expect(302)

      // Same subject, different username claim.
      const second = request.agent(app)
      const flow2 = await beginFlow(second)
      idp.setIdTokenClaims({
        sub: 'stable-subject',
        preferred_username: 'renamedname',
        nonce: flow2.nonce
      })
      await second
        .get(`/SASLogon/openid/callback?code=c&state=${flow2.state}`)
        .expect(302)

      // No second account, and the original name is retained.
      expect(await User.countDocuments({})).toEqual(1)
      const session = await second.get('/SASjsApi/session').expect(200)
      expect(session.body.username).toEqual('originalname')
    })

    it('should normalise an email-style username claim', async () => {
      const agent = request.agent(app)
      const { state, nonce } = await beginFlow(agent)

      idp.setIdTokenClaims({
        sub: 'sub-1',
        preferred_username: 'alice.smith@example.com',
        nonce
      })

      await agent
        .get(`/SASLogon/openid/callback?code=c&state=${state}`)
        .expect(302)

      const user = await User.findOne({ authProviderId: 'sub-1' })

      expect(user!.username).toEqual('alicesmithexampl')
    })

    it('should reject a callback with the wrong state', async () => {
      const agent = request.agent(app)
      const { nonce } = await beginFlow(agent)

      idp.setIdTokenClaims({ sub: 'alice', nonce })

      const res = await agent
        .get('/SASLogon/openid/callback?code=c&state=not-the-state')
        .expect(401)

      expect(res.text).toMatch(/Invalid or expired/)
      expect(await User.countDocuments({})).toEqual(0)
    })

    it('should reject a callback with no state at all', async () => {
      await request(app).get('/SASLogon/openid/callback?code=c').expect(401)
    })

    it('should reject a replayed callback, because state is single use', async () => {
      const agent = request.agent(app)
      const { state, nonce } = await beginFlow(agent)
      idp.setIdTokenClaims({ sub: 'alice', preferred_username: 'alice', nonce })

      await agent
        .get(`/SASLogon/openid/callback?code=c&state=${state}`)
        .expect(302)

      await agent
        .get(`/SASLogon/openid/callback?code=c&state=${state}`)
        .expect(401)
    })

    it('should reject a callback whose id_token carries the wrong nonce', async () => {
      const agent = request.agent(app)
      const { state } = await beginFlow(agent)

      idp.setIdTokenClaims({ sub: 'alice', nonce: 'a-different-nonce' })

      const res = await agent
        .get(`/SASLogon/openid/callback?code=c&state=${state}`)
        .expect(401)

      // The verifier's own message describes token internals and must not be
      // reflected to the caller.
      expect(res.text).toEqual(
        'OpenID Connect sign-in failed. Please try again.'
      )
      expect(await User.countDocuments({})).toEqual(0)
    })

    it('should report a provider refusal without leaking its description', async () => {
      const agent = request.agent(app)
      await beginFlow(agent)

      const res = await agent
        .get(
          '/SASLogon/openid/callback?error=access_denied&error_description=<script>alert(1)</script>'
        )
        .expect(401)

      expect(res.text).toEqual(
        'Sign-in was cancelled at the identity provider.'
      )
      expect(res.text).not.toContain('script')
      expect(res.type).toEqual('text/plain')
    })

    it('should refuse to adopt an existing local account with the same name', async () => {
      await User.create({
        displayName: 'Local Admin',
        username: 'alice',
        password: 'x',
        isAdmin: true
      })

      const agent = request.agent(app)
      const { state, nonce } = await beginFlow(agent)

      idp.setIdTokenClaims({
        sub: 'alice-sub',
        preferred_username: 'alice',
        nonce
      })

      const res = await agent
        .get(`/SASLogon/openid/callback?code=c&state=${state}`)
        .expect(403)

      expect(res.text).toMatch(/already exists and is not linked/)

      // The local account must be untouched.
      const user = await User.findOne({ username: 'alice' })
      expect(user!.isAdmin).toEqual(true)
      expect(user!.authProvider).toBeUndefined()
      expect(user!.authProviderId).toBeUndefined()
    })

    it('should refuse an unknown user when provisioning is disabled', async () => {
      process.env.OIDC_JIT_PROVISION = 'false'

      const agent = request.agent(app)
      const { state, nonce } = await beginFlow(agent)

      idp.setIdTokenClaims({
        sub: 'nobody',
        preferred_username: 'nobody',
        nonce
      })

      const res = await agent
        .get(`/SASLogon/openid/callback?code=c&state=${state}`)
        .expect(403)

      expect(res.text).toMatch(/provisioning is disabled/)
      expect(await User.countDocuments({})).toEqual(0)
    })

    it('should still sign in a known user when provisioning is disabled', async () => {
      const first = request.agent(app)
      const flow1 = await beginFlow(first)
      idp.setIdTokenClaims({
        sub: 'known',
        preferred_username: 'known',
        nonce: flow1.nonce
      })
      await first
        .get(`/SASLogon/openid/callback?code=c&state=${flow1.state}`)
        .expect(302)

      process.env.OIDC_JIT_PROVISION = 'false'

      const second = request.agent(app)
      const flow2 = await beginFlow(second)
      idp.setIdTokenClaims({
        sub: 'known',
        preferred_username: 'known',
        nonce: flow2.nonce
      })
      await second
        .get(`/SASLogon/openid/callback?code=c&state=${flow2.state}`)
        .expect(302)
    })

    it('should refuse a user whose account is not active', async () => {
      await User.create({
        displayName: 'Disabled',
        username: 'disableduser',
        password: 'x',
        authProvider: 'oidc',
        authProviderId: 'disabled-sub',
        isActive: false
      })

      const agent = request.agent(app)
      const { state, nonce } = await beginFlow(agent)

      idp.setIdTokenClaims({
        sub: 'disabled-sub',
        preferred_username: 'disableduser',
        nonce
      })

      const res = await agent
        .get(`/SASLogon/openid/callback?code=c&state=${state}`)
        .expect(403)

      expect(res.text).toMatch(/not active/)
    })
  })

  describe('GET /SASLogon/openid/logout', () => {
    it('should clear the session and return to the app when the provider has no end-session endpoint', async () => {
      const agent = request.agent(app)
      const { state, nonce } = await beginFlow(agent)
      idp.setIdTokenClaims({ sub: 'alice', preferred_username: 'alice', nonce })
      await agent
        .get(`/SASLogon/openid/callback?code=c&state=${state}`)
        .expect(302)

      await agent
        .get('/SASLogon/openid/logout')
        .expect(302)
        .expect('location', '/')

      await agent.get('/SASjsApi/session').expect(401)
    })

    it('should redirect to the provider end-session endpoint when it advertises one', async () => {
      idp.setEndSessionEndpoint(true)
      OIDCClient.reset()

      const agent = request.agent(app)
      const { state, nonce } = await beginFlow(agent)
      idp.setIdTokenClaims({ sub: 'alice', preferred_username: 'alice', nonce })
      await agent
        .get(`/SASLogon/openid/callback?code=c&state=${state}`)
        .expect(302)

      const res = await agent.get('/SASLogon/openid/logout').expect(302)
      const url = new URL(res.headers.location)

      expect(`${url.origin}${url.pathname}`).toEqual(`${idp.issuer}/logout`)
      expect(url.searchParams.get('id_token_hint')).toBeTruthy()
    })
  })

  describe('GET /SASjsApi/info', () => {
    it('should advertise the configured providers and the button label', async () => {
      const res = await request(app).get('/SASjsApi/info').expect(200)

      expect(res.body.authProviders).toEqual(['oidc'])
      expect(res.body.oidcProviderName).toEqual('Example Identity')
    })

    it('should omit the button label when OIDC is not configured', async () => {
      process.env.AUTH_PROVIDERS = 'ldap'

      const res = await request(app).get('/SASjsApi/info').expect(200)

      expect(res.body.authProviders).toEqual(['ldap'])
      expect(res.body.oidcProviderName).toBeUndefined()
    })
  })
})
