import { Cookie } from 'express-session'

import {
  installSessionCookieMaxAge,
  SESSION_MAX_AGE_MS
} from '../sessionCookie'

/**
 * The session cookie is serialized with `Max-Age` so that it states its
 * lifetime the same way the CSRF cookie does, while the object handed to the
 * session store keeps the shape express-session expects.
 *
 * The lifetime is assigned through the `maxAge` setter rather than the
 * constructor: @types/express-session declares no constructor arguments for
 * `Cookie`, and assigning is what express-session itself does (`resetMaxAge`).
 */
const withLifetime = <T extends Cookie>(cookie: T): T => {
  cookie.maxAge = SESSION_MAX_AGE_MS

  return cookie
}

const maxAgeInSeconds = (cookie: Cookie) =>
  Math.round((cookie.originalMaxAge as number) / 1000)

describe('session cookie lifetime', () => {
  beforeAll(() => installSessionCookieMaxAge())

  it('serializes Max-Age alongside Expires', () => {
    const cookie = withLifetime(new Cookie())
    const data = cookie.data

    expect(typeof data.maxAge).toBe('number')
    expect(data.maxAge).toBe(maxAgeInSeconds(cookie))
    expect(data.expires).toBeInstanceOf(Date)
  })

  it('turns the millisecond lifetime into seconds', () => {
    // `cookie.serialize` reads Max-Age as seconds; express-session works in
    // milliseconds. Passing the raw value would write a cookie 1000x too long.
    const cookie = withLifetime(new Cookie())

    expect(cookie.data.maxAge).toBe(86400)
  })

  it('keeps the session store document free of maxAge', () => {
    // Re-applying a stored maxAge on load would push the expiry forward on
    // every request, turning a fixed lifetime into a rolling one.
    const cookie = withLifetime(new Cookie())
    const stored = cookie.toJSON()

    expect(stored.maxAge).toBeUndefined()
    expect(stored.originalMaxAge).toBe(cookie.originalMaxAge)
    expect(stored.expires).toBeInstanceOf(Date)
  })

  it('applies to a cookie regenerated after setup', () => {
    // store.generate builds a fresh Cookie for a new or regenerated session,
    // which is why the behaviour sits on the prototype.
    const cookie = withLifetime(new Cookie())

    expect(cookie.data.maxAge).toBe(86400)
  })

  it('leaves a cookie with no lifetime alone', () => {
    const cookie = new Cookie()

    expect(cookie.originalMaxAge).toBeNull()
    expect(cookie.data.maxAge).toBeUndefined()
  })

  it('installs once', () => {
    expect(() => {
      installSessionCookieMaxAge()
      installSessionCookieMaxAge()
    }).not.toThrow()

    expect(withLifetime(new Cookie()).data.maxAge).toBe(86400)
  })
})
