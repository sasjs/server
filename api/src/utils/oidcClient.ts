import {
  createRemoteJWKSet,
  jwtVerify,
  JWTVerifyGetKey,
  JWTPayload
} from 'jose'
import { AuthProviderType, isAuthProviderEnabled } from './verifyEnvVariables'

export interface OIDCDiscoveryDocument {
  issuer: string
  authorization_endpoint: string
  token_endpoint: string
  jwks_uri: string
  userinfo_endpoint?: string
  end_session_endpoint?: string
  token_endpoint_auth_methods_supported?: string[]
}

export interface OIDCTokens {
  idToken: string
  accessToken?: string
}

/**
 * The identity as asserted by the provider, before any local policy is
 * applied. `username` is the raw claim value - normalising it into a sasjs
 * username is a provisioning concern, not a protocol one.
 */
export interface OIDCIdentity {
  /** The `sub` claim - the durable external identifier for this user. */
  subject: string
  /** The configured username claim, falling back to `sub`. */
  username: string
  displayName: string
}

const DISCOVERY_MEMBERS = [
  'issuer',
  'authorization_endpoint',
  'token_endpoint',
  'jwks_uri'
]

/**
 * A generic OpenID Connect relying party.
 *
 * Deliberately vendor-neutral: everything here is standard OIDC driven by the
 * provider's own discovery document, so no platform-specific knowledge (or
 * platform-specific variable name) appears in the code.
 *
 * Signature verification uses jose rather than the jsonwebtoken already in
 * this repo. jsonwebtoken cannot verify EdDSA at all (it fails with
 * `Unknown key type "ed25519"`); it covers RS256/384/512 and ES256/384/512
 * fine. jose also brings createRemoteJWKSet, which handles JWKS caching and
 * key rotation - fiddly to get right by hand.
 *
 * jose is pinned to v5, and that is a deliberate, load-bearing pin:
 * - v6 dropped its CommonJS build (no `require` condition in its exports map)
 *   and this API is CommonJS. It cannot simply become ESM: the server ships as
 *   standalone executables built with `pkg` (api-linux/macos/win), and pkg
 *   cannot package an ESM entry point - it exits 0 and then the binary fails
 *   at startup with MODULE_NOT_FOUND. Verified, with a CJS control that works.
 * - v5 is nonetheless not abandoned in a security sense: every published jose
 *   advisory is JWE-related and patched below 5.0.0, and this client never
 *   decrypts JWE - it only verifies JWS id_tokens.
 *
 * Revisit the pin if either of these changes: a JWS-relevant advisory lands
 * against jose 5.x with no v5 patch, or the project stops shipping the pkg
 * executables (at which point moving to v6 becomes straightforward).
 */
export class OIDCClient {
  private static classInstance: OIDCClient | null = null

  private discovery!: OIDCDiscoveryDocument
  private jwks!: JWTVerifyGetKey

  private constructor() {}

  static async init(): Promise<OIDCClient> {
    if (!OIDCClient.classInstance) {
      if (!isAuthProviderEnabled(AuthProviderType.OIDC)) {
        throw new Error(
          `OIDCClient requires AUTH_PROVIDERS to include '${AuthProviderType.OIDC}'`
        )
      }

      const instance = new OIDCClient()
      instance.discovery = await instance.fetchDiscoveryDocument()
      // Fetched lazily on first use and cached by jose, which also refetches
      // when it meets an unknown key id (rotation).
      instance.jwks = createRemoteJWKSet(new URL(instance.discovery.jwks_uri))

      process.logger?.info(
        `OIDC provider '${instance.discovery.issuer}' initialised`
      )

      OIDCClient.classInstance = instance
    }

    return OIDCClient.classInstance
  }

  /** Drops the cached instance - used by tests to pick up changed settings. */
  static reset() {
    OIDCClient.classInstance = null
  }

  private async fetchDiscoveryDocument(): Promise<OIDCDiscoveryDocument> {
    const { OIDC_ISSUER_URL, OIDC_DISCOVERY_URL } = process.env

    const discoveryUrl =
      OIDC_DISCOVERY_URL ??
      `${(OIDC_ISSUER_URL as string).replace(/\/+$/, '')}/.well-known/openid-configuration`

    let response: Response

    try {
      response = await fetch(discoveryUrl)
    } catch (error) {
      // A network-level failure (DNS, refused connection, TLS) would otherwise
      // escape as a bare TypeError with no indication of which URL was tried.
      throw new Error(
        `Failed to fetch the OIDC discovery document from ${discoveryUrl}: ${
          (error as Error).message
        }`
      )
    }

    if (!response.ok) {
      throw new Error(
        `Failed to fetch the OIDC discovery document from ${discoveryUrl} (${response.status})`
      )
    }

    const document = (await response.json()) as OIDCDiscoveryDocument

    DISCOVERY_MEMBERS.forEach((member) => {
      if (!document[member as keyof OIDCDiscoveryDocument]) {
        throw new Error(
          `OIDC discovery document at ${discoveryUrl} is missing '${member}'`
        )
      }
    })

    // RFC 8414: the issuer in the document must match the configured issuer.
    // Without this a discovery URL pointed at the wrong provider would be
    // accepted, and every token it signed would be trusted.
    if (
      OIDC_ISSUER_URL &&
      document.issuer.replace(/\/+$/, '') !==
        OIDC_ISSUER_URL.replace(/\/+$/, '')
    ) {
      throw new Error(
        `OIDC discovery document issuer '${document.issuer}' does not match OIDC_ISSUER_URL '${OIDC_ISSUER_URL}'`
      )
    }

    return document
  }

  /**
   * Builds the URL to redirect the browser to. `state` protects against CSRF
   * on the callback and `nonce` binds the id_token to this request - both must
   * be unguessable, stored server-side against the session, and consumed once.
   */
  getAuthorizationUrl(state: string, nonce: string): string {
    const url = new URL(this.discovery.authorization_endpoint)

    url.searchParams.set('client_id', process.env.OIDC_CLIENT_ID as string)
    url.searchParams.set(
      'redirect_uri',
      process.env.OIDC_REDIRECT_URI as string
    )
    url.searchParams.set('response_type', 'code')
    url.searchParams.set(
      'scope',
      process.env.OIDC_SCOPE ?? 'openid profile email'
    )
    url.searchParams.set('state', state)
    url.searchParams.set('nonce', nonce)

    return url.toString()
  }

  async exchangeCodeForTokens(code: string): Promise<OIDCTokens> {
    const clientId = process.env.OIDC_CLIENT_ID as string
    const clientSecret = process.env.OIDC_CLIENT_SECRET as string

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.OIDC_REDIRECT_URI as string
    })

    const headers: { [key: string]: string } = {
      'content-type': 'application/x-www-form-urlencoded',
      accept: 'application/json'
    }

    // RFC 6749 says a compliant server MUST support HTTP Basic, and that it is
    // the client's default. Only fall back to credentials in the body when the
    // provider advertises that method and not Basic.
    const methods = this.discovery.token_endpoint_auth_methods_supported ?? []
    const useSecretPost =
      !methods.includes('client_secret_basic') &&
      methods.includes('client_secret_post')

    if (useSecretPost) {
      body.set('client_id', clientId)
      body.set('client_secret', clientSecret)
    } else {
      headers.authorization = `Basic ${Buffer.from(
        `${encodeURIComponent(clientId)}:${encodeURIComponent(clientSecret)}`
      ).toString('base64')}`
    }

    let response: Response

    try {
      response = await fetch(this.discovery.token_endpoint, {
        method: 'POST',
        headers,
        body
      })
    } catch (error) {
      throw new Error(`OIDC token exchange failed: ${(error as Error).message}`)
    }

    if (!response.ok) {
      // The body may name the failure (invalid_grant, invalid_client, ...).
      // Never echo credentials, and the caller surfaces this to the user, so
      // keep it to the provider's own error text.
      const text = await response.text()
      throw new Error(
        `OIDC token exchange failed (${response.status}): ${text}`
      )
    }

    const tokens = (await response.json()) as {
      id_token?: string
      access_token?: string
    }

    if (!tokens.id_token) {
      throw new Error('OIDC token response did not include an id_token')
    }

    return { idToken: tokens.id_token, accessToken: tokens.access_token }
  }

  /**
   * Verifies the id_token's signature and claims and returns the asserted
   * identity. jose validates `iss`, `aud` and `exp`; the `nonce` is checked
   * here because it is not a registered claim jose knows to compare.
   */
  async verifyIdToken(idToken: string, nonce: string): Promise<OIDCIdentity> {
    const { payload } = await jwtVerify(idToken, this.jwks, {
      issuer: this.discovery.issuer,
      audience: process.env.OIDC_CLIENT_ID as string,
      algorithms: [process.env.OIDC_SIGNING_ALG ?? 'RS256'],
      clockTolerance: 60
    })

    if (!payload.nonce || payload.nonce !== nonce) {
      throw new Error('OIDC id_token nonce mismatch')
    }

    return this.toIdentity(payload)
  }

  private toIdentity(payload: JWTPayload): OIDCIdentity {
    const subject = payload.sub

    if (!subject) throw new Error('OIDC id_token did not include a sub claim')

    const claimName = process.env.OIDC_USERNAME_CLAIM ?? 'preferred_username'
    const claimed = payload[claimName]

    const username =
      typeof claimed === 'string' && claimed.trim() ? claimed : subject

    const name = payload.name

    return {
      subject,
      username,
      displayName: typeof name === 'string' && name ? name : username
    }
  }

  /**
   * Where to send the browser after a local logout, when the provider
   * advertises an end-session endpoint. Returns undefined when it does not,
   * in which case logout stays local.
   */
  getEndSessionUrl(idToken?: string): string | undefined {
    const endpoint = this.discovery.end_session_endpoint
    if (!endpoint) return undefined

    const url = new URL(endpoint)

    if (idToken) url.searchParams.set('id_token_hint', idToken)

    const postLogoutRedirectUri = process.env.OIDC_POST_LOGOUT_REDIRECT_URI
    if (postLogoutRedirectUri)
      url.searchParams.set('post_logout_redirect_uri', postLogoutRedirectUri)

    return url.toString()
  }
}
