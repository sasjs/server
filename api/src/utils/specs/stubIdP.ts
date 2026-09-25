import http from 'http'
import { AddressInfo } from 'net'
import { generateKeyPair, exportJWK, SignJWT, KeyLike } from 'jose'

/**
 * A minimal OpenID provider for tests: discovery document, JWKS, and a token
 * endpoint that returns a signed id_token. Enough to exercise the relying
 * party without any external service.
 *
 * Shared between the OIDCClient unit spec and the /SASLogon/openid route spec.
 */
export const ISSUER_PATH = '/openid'
export const STUB_CLIENT_ID = 'sasjs-server'
export const STUB_CLIENT_SECRET = 'oidc-client-secret'
export const STUB_REDIRECT_URI =
  'https://sas.example.com/SASLogon/openid/callback'

export interface StubSignOptions {
  /** Seconds since epoch, or an ms/vercel-style string. Default '5m'. */
  expiresIn?: string | number
  audience?: string
  issuer?: string
}

export interface StubIdP {
  issuer: string
  jwksUri: string
  tokenEndpoint: string
  /**
   * Sign an id_token directly, with whatever claims the caller wants. The
   * options exist so a test can produce a token that is genuinely signed by
   * the published key but carries a bad claim - otherwise such a test fails on
   * the signature and proves nothing about the claim it claims to test.
   */
  signIdToken: (
    payload: { [key: string]: unknown },
    options?: StubSignOptions
  ) => Promise<string>
  signEdDsaIdToken: (payload: { [key: string]: unknown }) => Promise<string>
  /** Signed by a key the JWKS does not publish - must never verify. */
  signWithUnknownKey: (payload: { [key: string]: unknown }) => Promise<string>
  /** Claims the token endpoint will use for the id_token it returns. */
  setIdTokenClaims: (claims: { [key: string]: unknown }) => void
  lastTokenRequest: () => { headers: any; body: string } | undefined
  setAuthMethods: (methods: string[]) => void
  setEndSessionEndpoint: (present: boolean) => void
  close: () => Promise<void>
}

export const startStubIdP = async (): Promise<StubIdP> => {
  const rsa = await generateKeyPair('RS256')
  const ed = await generateKeyPair('EdDSA')
  const unknown = await generateKeyPair('RS256')

  let authMethods: string[] = []
  let endSessionEndpoint = false
  let lastRequest: { headers: any; body: string } | undefined
  let idTokenClaims: { [key: string]: unknown } = { sub: 'alice' }
  let baseUrl = ''

  const jwks = async () => ({
    keys: [
      {
        ...(await exportJWK(rsa.publicKey)),
        kid: 'rsa1',
        alg: 'RS256',
        use: 'sig'
      },
      {
        ...(await exportJWK(ed.publicKey)),
        kid: 'ed1',
        alg: 'EdDSA',
        use: 'sig'
      }
    ]
  })

  const sign = async (
    key: KeyLike,
    kid: string,
    alg: string,
    payload: { [key: string]: unknown },
    options: StubSignOptions = {}
  ) =>
    new SignJWT(payload)
      .setProtectedHeader({ alg, kid })
      .setIssuer(options.issuer ?? `${baseUrl}${ISSUER_PATH}`)
      .setAudience(options.audience ?? STUB_CLIENT_ID)
      .setIssuedAt()
      .setExpirationTime(options.expiresIn ?? '5m')
      .sign(key)

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url as string, baseUrl)

    res.setHeader('content-type', 'application/json')

    if (url.pathname === `${ISSUER_PATH}/.well-known/openid-configuration`) {
      res.end(
        JSON.stringify({
          issuer: `${baseUrl}${ISSUER_PATH}`,
          authorization_endpoint: `${baseUrl}${ISSUER_PATH}/auth`,
          token_endpoint: `${baseUrl}${ISSUER_PATH}/token`,
          jwks_uri: `${baseUrl}${ISSUER_PATH}/jwks`,
          ...(authMethods.length
            ? { token_endpoint_auth_methods_supported: authMethods }
            : {}),
          ...(endSessionEndpoint
            ? { end_session_endpoint: `${baseUrl}${ISSUER_PATH}/logout` }
            : {})
        })
      )
      return
    }

    if (url.pathname === `${ISSUER_PATH}/jwks`) {
      res.end(JSON.stringify(await jwks()))
      return
    }

    if (url.pathname === `${ISSUER_PATH}/token`) {
      const chunks: Buffer[] = []
      for await (const chunk of req) chunks.push(chunk as Buffer)
      lastRequest = {
        headers: req.headers,
        body: Buffer.concat(chunks).toString()
      }

      const idToken = await sign(rsa.privateKey, 'rsa1', 'RS256', idTokenClaims)

      res.end(JSON.stringify({ id_token: idToken, access_token: 'at-123' }))
      return
    }

    res.statusCode = 404
    res.end('{}')
  })

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))

  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`

  return {
    get issuer() {
      return `${baseUrl}${ISSUER_PATH}`
    },
    get jwksUri() {
      return `${baseUrl}${ISSUER_PATH}/jwks`
    },
    get tokenEndpoint() {
      return `${baseUrl}${ISSUER_PATH}/token`
    },
    signIdToken: (payload, options) =>
      sign(rsa.privateKey, 'rsa1', 'RS256', payload, options),
    signEdDsaIdToken: (payload) => sign(ed.privateKey, 'ed1', 'EdDSA', payload),
    signWithUnknownKey: (payload) =>
      sign(unknown.privateKey, 'unknown-kid', 'RS256', payload),
    setIdTokenClaims: (claims) => {
      idTokenClaims = claims
    },
    lastTokenRequest: () => lastRequest,
    setAuthMethods: (methods) => {
      authMethods = methods
    },
    setEndSessionEndpoint: (present) => {
      endSessionEndpoint = present
    },
    close: () =>
      new Promise<void>((resolve) => {
        server.close(() => resolve())
      })
  }
}
