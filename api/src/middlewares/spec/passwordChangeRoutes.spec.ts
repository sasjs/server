import { Request } from 'express'
import { isPasswordChangeRoute } from '../passwordChangeRoutes'

/**
 * A flagged account may reach exactly three things: the SPA's own session poll,
 * the password change, and logout. The session entry used to be a prefix
 * match, which also admitted `/SASjsApi/session/{id}/log|output` - the artifacts
 * of a triggered program - before the password had been changed.
 */
const asRequest = (baseUrl: string, path: string) =>
  ({ baseUrl, path }) as unknown as Request

describe('isPasswordChangeRoute', () => {
  it('allows the session poll the SPA makes', () => {
    expect(isPasswordChangeRoute(asRequest('/SASjsApi/session', '/'))).toEqual(
      true
    )
    expect(isPasswordChangeRoute(asRequest('/SASjsApi/session', ''))).toEqual(
      true
    )
  })

  it('allows changing the password and logging out', () => {
    expect(
      isPasswordChangeRoute(asRequest('/SASjsApi/auth/updatePassword', '/'))
    ).toEqual(true)
    expect(isPasswordChangeRoute(asRequest('/SASLogon/logout', '/'))).toEqual(
      true
    )
  })

  it('does not admit the session artifacts', () => {
    // the three endpoints this PR adds: a flagged account must change its
    // password before it can read a log or a webout
    for (const path of ['/abc/log', '/abc/output', '/abc', '/abc/state'])
      expect(
        isPasswordChangeRoute(asRequest('/SASjsApi/session', path))
      ).toEqual(false)
  })

  it('does not admit an unrelated route', () => {
    expect(
      isPasswordChangeRoute(asRequest('/SASjsApi/drive', '/files'))
    ).toEqual(false)
  })

  it('answers the same on the /api alias', () => {
    // A client that uses the short spelling has to be able to change its
    // password, or a flagged account is stranded there.
    expect(isPasswordChangeRoute(asRequest('/api/session', '/'))).toEqual(true)
    expect(
      isPasswordChangeRoute(asRequest('/api/auth/updatePassword', '/'))
    ).toEqual(true)

    // and the exception is still the poll exactly, not the prefix
    for (const path of ['/abc/log', '/abc/output', '/abc'])
      expect(isPasswordChangeRoute(asRequest('/api/session', path))).toEqual(
        false
      )
  })
})
