import { OIDCClient } from '../oidcClient'
import {
  startStubIdP,
  StubIdP,
  ISSUER_PATH,
  STUB_CLIENT_ID as CLIENT_ID,
  STUB_CLIENT_SECRET as CLIENT_SECRET,
  STUB_REDIRECT_URI as REDIRECT_URI
} from './stubIdP'

const managedEnvVars = [
  'AUTH_PROVIDERS',
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

describe('OIDCClient', () => {
  let idp: StubIdP
  let originalEnv: { [key: string]: string | undefined }

  beforeAll(async () => {
    originalEnv = { ...process.env }
    ;(process as any).logger = { info: () => {}, error: () => {} }
  })

  beforeEach(async () => {
    idp = await startStubIdP()

    process.env.AUTH_PROVIDERS = 'oidc'
    process.env.OIDC_ISSUER_URL = idp.issuer
    process.env.OIDC_CLIENT_ID = CLIENT_ID
    process.env.OIDC_CLIENT_SECRET = CLIENT_SECRET
    process.env.OIDC_REDIRECT_URI = REDIRECT_URI
    process.env.OIDC_SIGNING_ALG = 'RS256'
    process.env.OIDC_SCOPE = 'openid profile email'
    process.env.OIDC_USERNAME_CLAIM = 'preferred_username'
    delete process.env.OIDC_DISCOVERY_URL
    delete process.env.OIDC_POST_LOGOUT_REDIRECT_URI

    OIDCClient.reset()
  })

  afterEach(async () => {
    OIDCClient.reset()
    await idp.close()

    managedEnvVars.forEach((key) => {
      if (originalEnv[key] === undefined) delete process.env[key]
      else process.env[key] = originalEnv[key]
    })
  })

  describe('init', () => {
    it('should refuse to initialise when the provider is not enabled', async () => {
      process.env.AUTH_PROVIDERS = 'ldap'

      await expect(OIDCClient.init()).rejects.toThrow(
        /requires AUTH_PROVIDERS to include 'oidc'/
      )
    })

    it('should reject a discovery document whose issuer does not match the configured issuer', async () => {
      // Point the discovery fetch at the stub (so it resolves) while claiming
      // a different issuer - this is the provider mix-up case.
      process.env.OIDC_DISCOVERY_URL = `${idp.issuer}/.well-known/openid-configuration`
      process.env.OIDC_ISSUER_URL = 'https://someone-else.example.com'

      await expect(OIDCClient.init()).rejects.toThrow(
        /does not match OIDC_ISSUER_URL/
      )
    })

    it('should fail when the discovery document cannot be fetched', async () => {
      await idp.close()
      OIDCClient.reset()

      await expect(OIDCClient.init()).rejects.toThrow(
        /Failed to fetch the OIDC discovery document/
      )
    })

    it('should return the same instance on repeated calls', async () => {
      const first = await OIDCClient.init()
      const second = await OIDCClient.init()

      expect(first).toBe(second)
    })
  })

  describe('getAuthorizationUrl', () => {
    it('should carry every parameter the provider requires', async () => {
      const client = await OIDCClient.init()
      const url = new URL(client.getAuthorizationUrl('state-123', 'nonce-456'))

      expect(url.origin + url.pathname).toEqual(`${idp.issuer}/auth`)
      expect(url.searchParams.get('client_id')).toEqual(CLIENT_ID)
      expect(url.searchParams.get('redirect_uri')).toEqual(REDIRECT_URI)
      expect(url.searchParams.get('response_type')).toEqual('code')
      expect(url.searchParams.get('scope')).toEqual('openid profile email')
      expect(url.searchParams.get('state')).toEqual('state-123')
      expect(url.searchParams.get('nonce')).toEqual('nonce-456')
    })
  })

  describe('exchangeCodeForTokens', () => {
    it('should return the id_token and access_token', async () => {
      const client = await OIDCClient.init()

      const tokens = await client.exchangeCodeForTokens('auth-code-1')

      expect(tokens.accessToken).toEqual('at-123')
      expect(typeof tokens.idToken).toEqual('string')
    })

    it('should authenticate with HTTP Basic by default', async () => {
      const client = await OIDCClient.init()

      await client.exchangeCodeForTokens('auth-code-1')

      const request = idp.lastTokenRequest()!
      const expected = Buffer.from(
        `${encodeURIComponent(CLIENT_ID)}:${encodeURIComponent(CLIENT_SECRET)}`
      ).toString('base64')

      expect(request.headers.authorization).toEqual(`Basic ${expected}`)
      expect(request.body).not.toContain(CLIENT_SECRET)
    })

    it('should fall back to credentials in the body when the provider advertises only client_secret_post', async () => {
      idp.setAuthMethods(['client_secret_post'])
      OIDCClient.reset()
      const client = await OIDCClient.init()

      await client.exchangeCodeForTokens('auth-code-1')

      const request = idp.lastTokenRequest()!
      expect(request.headers.authorization).toBeUndefined()
      expect(request.body).toContain('client_secret=oidc-client-secret')
      expect(request.body).toContain('grant_type=authorization_code')
      expect(request.body).toContain('code=auth-code-1')
    })

    it('should surface a provider error without leaking credentials', async () => {
      const client = await OIDCClient.init()
      idp.close()

      await expect(client.exchangeCodeForTokens('auth-code-1')).rejects.toThrow(
        /OIDC token exchange failed/
      )
    })
  })

  describe('verifyIdToken', () => {
    it('should accept a valid RS256 id_token and return the identity', async () => {
      const client = await OIDCClient.init()
      const idToken = await idp.signIdToken({
        sub: 'alice',
        preferred_username: 'alice',
        name: 'Alice Example',
        nonce: 'nonce-456'
      })

      const identity = await client.verifyIdToken(idToken, 'nonce-456')

      expect(identity).toEqual({
        subject: 'alice',
        username: 'alice',
        displayName: 'Alice Example'
      })
    })

    it('should accept an EdDSA id_token when that algorithm is configured', async () => {
      process.env.OIDC_SIGNING_ALG = 'EdDSA'
      OIDCClient.reset()
      const client = await OIDCClient.init()

      const idToken = await idp.signEdDsaIdToken({
        sub: 'bob',
        preferred_username: 'bob',
        nonce: 'n1'
      })

      const identity = await client.verifyIdToken(idToken, 'n1')

      expect(identity.subject).toEqual('bob')
    })

    it('should reject an EdDSA id_token when RS256 is configured', async () => {
      const client = await OIDCClient.init()
      const idToken = await idp.signEdDsaIdToken({ sub: 'bob', nonce: 'n1' })

      await expect(client.verifyIdToken(idToken, 'n1')).rejects.toThrow()
    })

    it('should reject an RS256 id_token when EdDSA is configured', async () => {
      process.env.OIDC_SIGNING_ALG = 'EdDSA'
      OIDCClient.reset()
      const client = await OIDCClient.init()

      const idToken = await idp.signIdToken({ sub: 'alice', nonce: 'n1' })

      await expect(client.verifyIdToken(idToken, 'n1')).rejects.toThrow()
    })

    it('should reject a mismatched nonce', async () => {
      const client = await OIDCClient.init()
      const idToken = await idp.signIdToken({
        sub: 'alice',
        nonce: 'nonce-456'
      })

      await expect(
        client.verifyIdToken(idToken, 'a-different-nonce')
      ).rejects.toThrow(/nonce mismatch/)
    })

    it('should reject an id_token with no nonce at all', async () => {
      const client = await OIDCClient.init()
      const idToken = await idp.signIdToken({ sub: 'alice' })

      await expect(client.verifyIdToken(idToken, 'nonce-456')).rejects.toThrow(
        /nonce mismatch/
      )
    })

    it('should reject an id_token signed by an unpublished key', async () => {
      const client = await OIDCClient.init()
      const idToken = await idp.signWithUnknownKey({
        sub: 'mallory',
        nonce: 'nonce-456'
      })

      await expect(client.verifyIdToken(idToken, 'nonce-456')).rejects.toThrow()
    })

    it('should reject an expired id_token', async () => {
      const client = await OIDCClient.init()

      // Signed by the published key, so the only thing wrong with it is exp -
      // otherwise this would fail on the signature and prove nothing.
      const expired = await idp.signIdToken(
        { sub: 'alice', nonce: 'n' },
        { expiresIn: Math.floor(Date.now() / 1000) - 3600 }
      )

      await expect(client.verifyIdToken(expired, 'n')).rejects.toThrow(/exp/i)
    })

    it('should reject an id_token with the wrong audience', async () => {
      const client = await OIDCClient.init()

      const idToken = await idp.signIdToken(
        { sub: 'alice', nonce: 'n' },
        { audience: 'some-other-client' }
      )

      await expect(client.verifyIdToken(idToken, 'n')).rejects.toThrow(/aud/i)
    })

    it('should reject an id_token from the wrong issuer', async () => {
      const client = await OIDCClient.init()

      const idToken = await idp.signIdToken(
        { sub: 'alice', nonce: 'n' },
        { issuer: 'https://someone-else.example.com' }
      )

      await expect(client.verifyIdToken(idToken, 'n')).rejects.toThrow(/iss/i)
    })

    it('should fall back to sub when the username claim is absent', async () => {
      process.env.OIDC_USERNAME_CLAIM = 'preferred_username'
      OIDCClient.reset()
      const client = await OIDCClient.init()

      const idToken = await idp.signIdToken({
        sub: 'no-claim-user',
        nonce: 'n'
      })
      const identity = await client.verifyIdToken(idToken, 'n')

      expect(identity.username).toEqual('no-claim-user')
      expect(identity.displayName).toEqual('no-claim-user')
    })

    it('should honour a custom username claim', async () => {
      process.env.OIDC_USERNAME_CLAIM = 'email'
      OIDCClient.reset()
      const client = await OIDCClient.init()

      const idToken = await idp.signIdToken({
        sub: 'alice',
        email: 'alice@example.com',
        nonce: 'n'
      })

      const identity = await client.verifyIdToken(idToken, 'n')

      expect(identity.username).toEqual('alice@example.com')
    })
  })

  describe('getEndSessionUrl', () => {
    it('should return undefined when the provider has no end-session endpoint', async () => {
      const client = await OIDCClient.init()

      expect(client.getEndSessionUrl('id-token')).toBeUndefined()
    })

    it('should build the end-session URL with the id_token hint', async () => {
      idp.setEndSessionEndpoint(true)
      OIDCClient.reset()
      const client = await OIDCClient.init()

      const url = new URL(client.getEndSessionUrl('id-token')!)

      expect(url.origin + url.pathname).toEqual(`${idp.issuer}/logout`)
      expect(url.searchParams.get('id_token_hint')).toEqual('id-token')
    })

    it('should include the post-logout redirect when configured', async () => {
      idp.setEndSessionEndpoint(true)
      process.env.OIDC_POST_LOGOUT_REDIRECT_URI = 'https://sas.example.com/'
      OIDCClient.reset()
      const client = await OIDCClient.init()

      const url = new URL(client.getEndSessionUrl('id-token')!)

      expect(url.searchParams.get('post_logout_redirect_uri')).toEqual(
        'https://sas.example.com/'
      )
    })
  })
})
