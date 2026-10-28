import { Cookie } from 'express-session'

/**
 * Lifetime shared by the session cookie and the CSRF cookie.
 *
 * The two cookies are a pair: the token is only valid against the session that
 * minted it (see middlewares/csrfProtection.ts), so they have to expire
 * together. One constant means a change to the session lifetime cannot leave
 * the token living longer than the session it belongs to.
 */
export const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000

/**
 * `Cookie#data` is the object express-session hands to `cookie.serialize` when
 * it writes the `connect.sid` header, and `toJSON` is what the session store
 * persists. @types/express-session declares neither, so name them here rather
 * than casting at each use.
 */
declare module 'express-session' {
  interface Cookie {
    data: Record<string, unknown>
    toJSON(): Record<string, unknown>
  }
}

/**
 * The stock accessor, captured before the prototype is patched - looking it up
 * at call time would find the patched one and recurse.
 */
const baseDataDescriptor = Object.getOwnPropertyDescriptor(
  Cookie.prototype,
  'data'
)

const readBaseData = (cookie: Cookie): Record<string, unknown> =>
  baseDataDescriptor?.get ? baseDataDescriptor.get.call(cookie) : {}

/**
 * Serialize the session cookie with `Max-Age` as well as `Expires`.
 *
 * express-session builds `Cookie#data` with `expires` only: `cookie.maxAge` is
 * turned into a date when it is assigned and never reaches the header. The CSRF
 * cookie is set through `res.cookie(..., { maxAge })` and therefore carries both
 * attributes, so the pair states one lifetime in two different ways and a
 * client can end up holding the token after the session cookie it belongs to
 * has gone. Every state-changing request then answers `400 Invalid CSRF token!`,
 * the first login included, with no way back in but a reload. Issuing both
 * attributes from both cookies removes that possibility.
 *
 * The serializer takes Max-Age in SECONDS while express-session works in
 * milliseconds, and express-session never passes maxAge on, so the conversion
 * is ours: the raw value would write a cookie a thousand times too long. It is
 * rounded because `originalMaxAge` is derived from an expiry date and can come
 * back a millisecond short, which would otherwise be advertised as one second
 * less than the lifetime configured next to it.
 */
const withMaxAge = (cookie: Cookie): Record<string, unknown> => {
  const data = readBaseData(cookie)
  const maxAge = cookie.originalMaxAge

  return typeof maxAge === 'number'
    ? { ...data, maxAge: Math.round(maxAge / 1000) }
    : data
}

let installed = false

/**
 * Apply the serialization above to the session cookie.
 *
 * It has to cover every `Cookie` express-session creates, not just the one a
 * request starts with: `store.generate` builds a fresh cookie when a session is
 * created and again when the session is regenerated (logout, and the
 * session-fixation rotation on login), after any request middleware has run.
 * Patching the prototype is the one place a route that regenerates later cannot
 * miss.
 *
 * `toJSON` is left at the base shape on purpose. It is what the session store
 * persists, and a stored `maxAge` is re-applied when the session loads, which
 * would push the expiry forward on every request.
 */
export const installSessionCookieMaxAge = () => {
  if (installed || !baseDataDescriptor?.get) return

  Object.defineProperty(Cookie.prototype, 'data', {
    configurable: true,
    enumerable: baseDataDescriptor.enumerable,
    get(this: Cookie) {
      return withMaxAge(this)
    }
  })

  Object.defineProperty(Cookie.prototype, 'toJSON', {
    configurable: true,
    enumerable: false,
    writable: true,
    value(this: Cookie) {
      return readBaseData(this)
    }
  })

  installed = true
}
