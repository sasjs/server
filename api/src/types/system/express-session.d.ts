import express from 'express'
declare module 'express-session' {
  interface SessionData {
    loggedIn: boolean
    user: import('../').RequestUser
    /**
     * In-flight OIDC authorization request. `state` binds the callback to this
     * browser session (the callback is a GET from the provider, so it carries
     * no CSRF token), `nonce` binds the returned id_token to this request, and
     * `codeVerifier` is the PKCE secret whose digest travelled in the
     * authorization request. All three are single-use: consumed and cleared as
     * soon as the callback runs.
     */
    oidc?: {
      state: string
      nonce: string
      codeVerifier: string
    }
    /**
     * The id_token issued at login, retained only so that logout can pass it
     * to the provider as `id_token_hint`. Never returned to the client.
     */
    oidcIdToken?: string
  }
}
